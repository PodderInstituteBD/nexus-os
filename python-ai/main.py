from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import tempfile
import json
from processor import analyze_csv_data

app = FastAPI(
    title="NEXUS OS AI & Data Processing Microservice",
    version="1.0.0",
    description="Python FastAPI service handling CSV statistical computing, project metric extraction, and AI orchestration."
)

class TaskDecomposeRequest(BaseModel):
    project_title: str
    feature_description: str
    target_role: Optional[str] = "DEVELOPER"

class SubtaskItem(BaseModel):
    title: str
    estimated_hours: float
    priority: str

class TaskDecomposeResponse(BaseModel):
    suggested_title: str
    subtasks: List[SubtaskItem]
    risk_level: str
    architecture_notes: str

class HealthAnalysisRequest(BaseModel):
    open_tasks: int
    completed_tasks: int
    overdue_tasks: int
    blocked_tasks: int
    active_contributors: int

class HealthAnalysisResponse(BaseModel):
    health_score: int
    status: str
    factors: List[str]
    recommendations: List[str]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "nexus-ai-python", "version": "1.0.0"}

@app.post("/api/v1/data/analyze-csv")
async def analyze_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
        
    try:
        results = analyze_csv_data(tmp_path)
        return results
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

@app.post("/api/v1/metrics/project-health", response_model=HealthAnalysisResponse)
def calculate_project_health(req: HealthAnalysisRequest):
    total_tasks = req.open_tasks + req.completed_tasks
    if total_tasks == 0:
        return HealthAnalysisResponse(
            health_score=100,
            status="HEALTHY",
            factors=["No active tasks yet - clean slate"],
            recommendations=["Add milestone tasks with realistic deadlines"]
        )
    
    score = 100
    factors = []
    recommendations = []
    
    overdue_ratio = req.overdue_tasks / max(total_tasks, 1)
    if overdue_ratio > 0.3:
        score -= 30
        factors.append(f"Critical overdue tasks: {req.overdue_tasks} ({int(overdue_ratio*100)}% of total)")
        recommendations.append("Re-triage sprint deadlines or adjust capacity allocation")
    elif overdue_ratio > 0.1:
        score -= 15
        factors.append(f"Overdue tasks present: {req.overdue_tasks}")
        recommendations.append("Prioritize pending blocked and overdue items")

    if req.blocked_tasks > 0:
        deduction = min(25, req.blocked_tasks * 8)
        score -= deduction
        factors.append(f"{req.blocked_tasks} task(s) currently marked as BLOCKED")
        recommendations.append("Unblock dependency items or assign senior review")

    completion_ratio = req.completed_tasks / max(total_tasks, 1)
    if completion_ratio > 0.7:
        score = min(100, score + 10)
        factors.append(f"High task completion rate: {int(completion_ratio*100)}%")

    score = max(5, min(100, score))
    status = "CRITICAL" if score < 50 else ("WARNING" if score < 75 else "HEALTHY")
    
    return HealthAnalysisResponse(
        health_score=score,
        status=status,
        factors=factors,
        recommendations=recommendations
    )
