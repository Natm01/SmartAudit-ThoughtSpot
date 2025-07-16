# Servicio de aplicaciones
# backend/app/services/application_service.py
import json
import os
from typing import List
from app.models.application import Application
from app.models.user import User

class ApplicationService:
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'applications.json')
    
    def _load_applications_data(self) -> List[dict]:
        """Cargar datos de aplicaciones desde el archivo JSON"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as file:
                data = json.load(file)
                return data.get('applications', [])
        except FileNotFoundError:
            return []
        except json.JSONDecodeError:
            return []
    
    def get_all_applications(self) -> List[Application]:
        """Obtener todas las aplicaciones disponibles"""
        applications_data = self._load_applications_data()
        return [Application(**app_data) for app_data in applications_data]
    
    def get_applications_for_user(self, user: User) -> List[Application]:
        """Obtener aplicaciones filtradas según los permisos del usuario"""
        all_applications = self.get_all_applications()
        user_applications = []
        
        for app in all_applications:
            if app.isActive and self._user_has_permission(user, app.permissionRequired):
                user_applications.append(app)
        
        return user_applications
    
    def _user_has_permission(self, user: User, permission_required: str) -> bool:
        """Verificar si el usuario tiene el permiso requerido"""
        if not permission_required:
            return True
        
        return getattr(user.permissions, permission_required, False)
    
    def get_application_by_id(self, app_id: str) -> Application:
        """Obtener una aplicación específica por ID"""
        applications = self.get_all_applications()
        
        for app in applications:
            if app.id == app_id:
                return app
        
        return None