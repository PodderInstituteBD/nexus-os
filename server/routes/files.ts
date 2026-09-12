import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { db } from '../db.js';
import { authenticate, AuthenticatedRequest } from '../auth.js';

const router = Router();
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and prepend unique timestamp
    const safeBase = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${safeBase}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.json', '.txt', '.pdf', '.docx', '.png', '.jpg', '.jpeg', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${ext}" not supported. Allowed: ${allowedExtensions.join(', ')}`));
    }
  }
});

function runPythonCsvAnalysis(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'python-ai', 'processor.py');
    const pythonProc = spawn('python3', [scriptPath, filePath]);
    
    let stdout = '';
    let stderr = '';

    pythonProc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python processor exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err: any) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });
  });
}

router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const { teamId, projectId } = req.query as Record<string, string>;
  const files = db.getFiles(teamId, projectId);
  res.json({ files });
});

router.post('/upload', authenticate, upload.single('file'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file was uploaded.' });
      return;
    }

    const { teamId, projectId } = req.body;
    if (!teamId) {
      res.status(400).json({ error: 'teamId is required.' });
      return;
    }

    let analysisSummary: any = null;
    const isCsv = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';

    if (isCsv) {
      try {
        analysisSummary = await runPythonCsvAnalysis(req.file.path);
      } catch (err: any) {
        console.error('CSV analysis error:', err);
        analysisSummary = { error: 'Python CSV analysis failed: ' + err.message };
      }
    }

    const newFile = db.addFile({
      teamId,
      projectId: projectId || undefined,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/octet-stream',
      sizeBytes: req.file.size,
      storedPath: req.file.path,
      uploadedBy: req.user!.fullName,
      analysisSummary
    });

    db.logActivity(teamId, projectId, req.user!.fullName, 'FILE_UPLOADED', `Uploaded "${newFile.originalName}" (${Math.round(newFile.sizeBytes / 1024)} KB)`);

    res.status(201).json({ file: newFile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'File upload failed.' });
  }
});

router.get('/:id/download', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const files = db.getFiles();
  const file = files.find(f => f.id === req.params.id);
  if (!file || !fs.existsSync(file.storedPath)) {
    res.status(404).json({ error: 'File not found on server storage.' });
    return;
  }

  // Prevent directory traversal
  const resolved = path.resolve(file.storedPath);
  if (!resolved.startsWith(UPLOAD_DIR)) {
    res.status(403).json({ error: 'Unauthorized file path access.' });
    return;
  }

  res.download(file.storedPath, file.originalName);
});

router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  const success = db.deleteFile(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'File record not found.' });
    return;
  }
  res.json({ success: true });
});

export default router;
