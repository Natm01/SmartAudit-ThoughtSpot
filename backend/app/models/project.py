# backend/app/models/project.py
from pydantic import BaseModel
from typing import List

class Project(BaseModel):
    id: str
    name: str
    type: str
    client: str
    description: str = ""
    status: str = "active"
    startDate: str = ""
    endDate: str = ""

class ProjectsResponse(BaseModel):
    projects: List[Project]
    success: bool = True
    message: str = "Proyectos obtenidos correctamente"