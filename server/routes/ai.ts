import { Router, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { authenticate, AuthenticatedRequest } from '../auth.js';
import { db } from '../db.js';

const router = Router();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

router.get('/status', (req, res) => {
  const isAvailable = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    available: isAvailable,
    model: 'gemini-3.8-flash',
    provider: 'Google Gemini SDK (@google/genai)',
    status: isAvailable ? 'READY' : 'UNAVAILABLE',
    hint: isAvailable ? 'AI services fully operational.' : 'Configure GEMINI_API_KEY in AI Studio Settings > Secrets to activate live generation.'
  });
});

router.post('/decompose-task', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { title, description, projectId } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Task title is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini AI service unavailable. GEMINI_API_KEY is not configured on the server.',
      hint: 'Please provide GEMINI_API_KEY in Settings > Secrets to enable live AI task decomposition.'
    });
    return;
  }

  const project = projectId ? db.getProjectById(projectId) : null;
  const projectContext = project ? `Project: "${project.name}" (${project.description})` : 'General engineering task';

  const prompt = `You are a Principal Software Architect on NEXUS OS.
Break down the following engineering task into high-impact, actionable subtasks.

Task Title: ${title}
Task Context/Description: ${description || 'No additional details provided.'}
${projectContext}

Return a valid JSON object matching this schema:
{
  "summary": "Short 1-2 sentence engineering overview",
  "estimatedTotalHours": number,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "subtasks": [
    {
      "title": "Clear concise imperative title (e.g. Implement Redis Lua script)",
      "estimatedHours": number,
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "technicalConsiderations": [
    "string points covering architecture, security, edge cases, or testing"
  ]
}
Only output the raw JSON object, without markdown formatting or code blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'AI task decomposition failed: ' + err.message });
  }
});

router.post('/analyze-project', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { projectId } = req.body;
  if (!projectId) {
    res.status(400).json({ error: 'projectId is required.' });
    return;
  }

  const project = db.getProjectById(projectId);
  if (!project) {
    res.status(404).json({ error: 'Project not found.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini AI service unavailable. GEMINI_API_KEY is not configured on the server.',
      hint: 'Please configure GEMINI_API_KEY in Settings > Secrets.'
    });
    return;
  }

  const tasks = db.getTasks({ projectId });
  const tasksSummary = tasks.map(t => ({
    title: t.title,
    status: t.status,
    priority: t.priority,
    estHours: t.estimatedHours,
    subtasksCompleted: t.subtasks.filter(s => s.completed).length,
    subtasksTotal: t.subtasks.length
  }));

  const prompt = `You are the Lead Reliability & Productivity Architect on NEXUS OS.
Analyze the following project workload and provide an objective engineering review:

Project Name: ${project.name}
Description: ${project.description}
Current Health Score: ${project.healthScore}/100
Tasks Data: ${JSON.stringify(tasksSummary, null, 2)}

Provide a structured JSON output with:
{
  "executiveSummary": "Concise high-level status of sprint progression",
  "projectHealthGrade": "A" | "B" | "C" | "D" | "F",
  "bottlenecks": ["List of specific risks, blocked workflows, or overloaded areas"],
  "recommendedActions": ["List of concrete tactical next steps for the engineering lead"],
  "technicalDebtAssessment": "Brief technical evaluation of potential architectural debt"
}
Only output the raw JSON object, without markdown formatting or code blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Project analysis failed: ' + err.message });
  }
});

router.post('/explain-code', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { code, language } = req.body;
  if (!code) {
    res.status(400).json({ error: 'Code snippet is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini AI service unavailable. GEMINI_API_KEY is not configured on the server.',
      hint: 'Configure GEMINI_API_KEY in Settings > Secrets.'
    });
    return;
  }

  const prompt = `You are a Principal Security & Systems Engineer on NEXUS OS.
Review and explain the following code snippet (${language || 'auto-detect'}):

\`\`\`${language || ''}
${code}
\`\`\`

Return a structured JSON object:
{
  "summary": "What this code does concisely",
  "architectureAndPatterns": "Design patterns, algorithmic complexity, and data structures used",
  "securityAndVulnerabilities": ["List any security issues, resource leaks, edge cases, or null checks"],
  "optimizationSuggestions": ["Concrete ideas to improve performance, readability, or reliability"],
  "refactoredCode": "Cleaned up / hardened code implementation if applicable, or empty string"
}
Only output the raw JSON object, without markdown formatting.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: 'Code explanation failed: ' + err.message });
  }
});

router.post('/generate-docs', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { docType, context, title } = req.body;
  if (!context) {
    res.status(400).json({ error: 'Context / source specification is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini AI service unavailable. GEMINI_API_KEY is not configured on the server.',
      hint: 'Configure GEMINI_API_KEY in Settings > Secrets.'
    });
    return;
  }

  const prompt = `You are the Lead Technical Writer on NEXUS OS.
Generate professional, comprehensive technical documentation in Markdown format.

Document Type: ${docType || 'API Specification / Architectural Design Record'}
Title: ${title || 'Technical Documentation'}
Source Context:
${context}

Format the output cleanly using Markdown with headings, code blocks, tables, and lists. Do not include meta chatter or preamble. Return directly the markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });

    res.json({ markdown: response.text || '' });
  } catch (err: any) {
    res.status(500).json({ error: 'Documentation generation failed: ' + err.message });
  }
});

router.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { message, conversationHistory, modelPreference, rolePreset, customSystemInstruction } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'Gemini AI service unavailable. GEMINI_API_KEY is not configured on the server.',
      hint: 'Please configure GEMINI_API_KEY in Settings > Secrets to chat with NEXUS AI.'
    });
    return;
  }

  const user = req.user!;

  // Dynamic model resolution adhering strictly to model guide:
  // - gemini-3.1-pro-preview: for complex reasoning, architectural design, deep coding
  // - gemini-3.5-flash: for general tasks and balanced high-intelligence conversations
  // - gemini-3.1-flash-lite: for fast real-time quick tasks
  let selectedModel = 'gemini-3.5-flash';
  if (modelPreference === 'gemini-3.1-pro-preview' || modelPreference === 'complex') {
    selectedModel = 'gemini-3.1-pro-preview';
  } else if (modelPreference === 'gemini-3.1-flash-lite' || modelPreference === 'fast') {
    selectedModel = 'gemini-3.1-flash-lite';
  } else if (modelPreference === 'gemini-3.5-flash' || modelPreference === 'general') {
    selectedModel = 'gemini-3.5-flash';
  }

  // System instruction with role customization
  let roleTone = 'Principal Full-Stack Architect and Developer Productivity Lead';
  if (rolePreset === 'SECURITY_AUDITOR') {
    roleTone = 'Lead Application Security Engineer and OWASP Penetration Testing Expert';
  } else if (rolePreset === 'CODER') {
    roleTone = 'Staff Software Engineer specializing in pristine TypeScript, React 19, Spring Boot, and Node.js microservices';
  } else if (rolePreset === 'DATA_ENGINEER') {
    roleTone = 'Principal Database Architect specializing in PostgreSQL schemas, Redis caching, and real-time distributed pipelines';
  }

  const systemInstruction = customSystemInstruction || `You are NEXUS AI, an elite autonomous developer assistant integrated into NEXUS OS.
Role Persona: ${roleTone}.
Assisting: ${user.fullName} (${user.role}).
Model Engine: ${selectedModel}.
Guidelines:
1. Provide mathematically sound, production-ready, clean implementations.
2. If suggesting code, output modern TypeScript, clean React 19 components, or optimized SQL.
3. Keep answers direct, authoritative, structured with clean Markdown sections, and avoid unsolicited preamble or generic boilerplate.`;

  try {
    const contents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const item of conversationHistory.slice(-16)) {
        if (!item.content) continue;
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.content }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({
      role: 'assistant',
      content: response.text || 'I processed your request, but received no text output.',
      modelUsed: selectedModel,
      rolePreset: rolePreset || 'ARCHITECT',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'NEXUS AI chat failed: ' + err.message });
  }
});

export default router;
