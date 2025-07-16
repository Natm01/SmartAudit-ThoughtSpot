# backend/app/routers/projects.py
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.project import Project, ProjectsResponse
from app.services.project_service import ProjectService
from app.services.user_service import UserService

router = APIRouter()
project_service = ProjectService()
user_service = UserService()

@router.get("/", response_model=ProjectsResponse)
async def get_all_projects():
    """Obtener todos los proyectos disponibles"""
    try:
        projects = project_service.get_all_projects()
        
        return ProjectsResponse(
            projects=projects,
            success=True,
            message="Proyectos obtenidos correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=ProjectsResponse)
async def get_projects_for_user(user_id: str):
    """Obtener proyectos disponibles para un usuario específico"""
    try:
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"Usuario {user_id} no encontrado"
            )
        
        projects = project_service.get_projects_for_user(user)
        
        return ProjectsResponse(
            projects=projects,
            success=True,
            message=f"Proyectos para {user.name} obtenidos correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/current-user", response_model=ProjectsResponse)
async def get_projects_for_current_user():
    """Obtener proyectos para el usuario actual"""
    try:
        user = user_service.get_current_user()
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="Usuario actual no encontrado"
            )
        
        projects = project_service.get_projects_for_user(user)
        
        return ProjectsResponse(
            projects=projects,
            success=True,
            message=f"Proyectos para {user.name} obtenidos correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )