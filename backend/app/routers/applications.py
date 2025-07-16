# Rutas de aplicaciones
# backend/app/routers/applications.py
from fastapi import APIRouter, HTTPException
from app.models.application import ApplicationsResponse
from app.services.application_service import ApplicationService
from app.services.user_service import UserService

router = APIRouter()
application_service = ApplicationService()
user_service = UserService()

@router.get("/", response_model=ApplicationsResponse)
async def get_applications():
    """Obtener todas las aplicaciones disponibles"""
    try:
        applications = application_service.get_all_applications()
        
        return ApplicationsResponse(
            applications=applications,
            success=True,
            message="Aplicaciones obtenidas correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/for-user/{user_id}", response_model=ApplicationsResponse)
async def get_applications_for_user(user_id: str):
    """Obtener aplicaciones filtradas para un usuario específico"""
    try:
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"Usuario {user_id} no encontrado"
            )
        
        applications = application_service.get_applications_for_user(user)
        
        return ApplicationsResponse(
            applications=applications,
            success=True,
            message=f"Aplicaciones para {user.name} obtenidas correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/current-user", response_model=ApplicationsResponse)
async def get_applications_for_current_user():
    """Obtener aplicaciones para el usuario actual"""
    try:
        user = user_service.get_current_user()
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="Usuario actual no encontrado"
            )
        
        applications = application_service.get_applications_for_user(user)
        
        return ApplicationsResponse(
            applications=applications,
            success=True,
            message=f"Aplicaciones para {user.name} obtenidas correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )