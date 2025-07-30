# Rutas de usuarios
# backend/app/routers/users.py
from fastapi import APIRouter, HTTPException
from app.models.user import UserResponse, UsersListResponse
from app.services.user_service import UserService

router = APIRouter()
user_service = UserService()

@router.get("/current", response_model=UserResponse)
async def get_current_user():
    """Obtener información del usuario actual"""
    try:
        user = user_service.get_current_user()
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail="Usuario no encontrado"
            )
        
        return UserResponse(
            user=user,
            success=True,
            message="Usuario obtenido correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/all", response_model=UsersListResponse)
async def get_all_users():
    """Obtener todos los usuarios disponibles"""
    try:
        users = user_service.get_all_users()
        
        return UsersListResponse(
            users=users,
            success=True,
            message="Usuarios obtenidos correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    """Obtener información de un usuario específico"""
    try:
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=404, 
                detail=f"Usuario {user_id} no encontrado"
            )
        
        return UserResponse(
            user=user,
            success=True,
            message="Usuario obtenido correctamente"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/{user_id}/permissions/{permission}")
async def check_user_permission(user_id: str, permission: str):
    """Verificar si un usuario tiene un permiso específico"""
    try:
        has_permission = user_service.validate_user_permission(user_id, permission)
        
        return {
            "userId": user_id,
            "permission": permission,
            "hasPermission": has_permission,
            "success": True
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno del servidor: {str(e)}"
        )