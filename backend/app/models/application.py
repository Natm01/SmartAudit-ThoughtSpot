# Modelos de aplicaciones
# backend/app/models/application.py
from pydantic import BaseModel
from typing import List

class Application(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    route: str
    permissionRequired: str
    color: str = "#7C3AED"  # Default purple color
    isActive: bool = True

class ApplicationsResponse(BaseModel):
    applications: List[Application]
    success: bool = True
    message: str = "Aplicaciones obtenidas correctamente"