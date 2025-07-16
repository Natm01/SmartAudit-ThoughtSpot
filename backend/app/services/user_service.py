# Servicio de usuarios
# backend/app/services/user_service.py
import json
import os
from typing import Optional
from app.models.user import User, UserPermissions

class UserService:
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'users.json')
    
    def _load_users_data(self) -> dict:
        """Cargar datos de usuarios desde el archivo JSON"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            return {}
        except json.JSONDecodeError:
            return {}
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Obtener usuario por ID"""
        users_data = self._load_users_data()
        
        if user_id in users_data:
            user_data = users_data[user_id]
            
            # Convertir permisos a objeto UserPermissions
            permissions = UserPermissions(**user_data.get('permissions', {}))
            
            return User(
                id=user_data['id'],
                name=user_data['name'],
                email=user_data['email'],
                role=user_data['role'],
                roleName=user_data['roleName'],
                department=user_data['department'],
                projects=user_data['projects'],
                permissions=permissions,
                status=user_data['status'],
                createdAt=user_data['createdAt'],
                lastLogin=user_data['lastLogin']
            )
        
        return None
    
    def get_current_user(self) -> Optional[User]:
        """Obtener usuario actual (simulado)"""
        # Por ahora devolvemos un usuario fijo para pruebas
        return self.get_user_by_id("maria.garcia")
    
    def validate_user_permission(self, user_id: str, permission: str) -> bool:
        """Validar si un usuario tiene un permiso específico"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        return getattr(user.permissions, permission, False)