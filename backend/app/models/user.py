# Modelos de usuario
# backend/app/models/user.py
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class UserPermissions(BaseModel):
    canAccessLibroDiario: bool = False
    canAccessAnalisisJET: bool = False
    canAccessAnalisisRiesgos: bool = False
    canAccessAnalisisObsolescencia: bool = False
    canManageProjects: bool = False
    canViewAllProjects: bool = False
    canAccessThoughtSpot: bool = False

class User(BaseModel):
    id: str
    name: str
    email: str
    role: str
    roleName: str
    department: str
    projects: List[str]
    permissions: UserPermissions
    status: str
    createdAt: str
    lastLogin: str

class UserResponse(BaseModel):
    user: User
    success: bool = True
    message: str = "Usuario obtenido correctamente"