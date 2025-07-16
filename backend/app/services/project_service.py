# backend/app/services/project_service.py
import json
import os
from typing import List
from app.models.project import Project
from app.models.user import User

class ProjectService:
    def __init__(self):
        self.data_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'projects.json')
    
    def _load_projects_data(self) -> List[dict]:
        """Cargar datos de proyectos desde el archivo JSON"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as file:
                data = json.load(file)
                return data.get('projects', [])
        except FileNotFoundError:
            return []
        except json.JSONDecodeError:
            return []
    
    def get_all_projects(self) -> List[Project]:
        """Obtener todos los proyectos disponibles"""
        projects_data = self._load_projects_data()
        return [Project(**project_data) for project_data in projects_data]
    
    def get_projects_for_user(self, user: User) -> List[Project]:
        """Obtener proyectos filtrados según los proyectos asignados al usuario"""
        all_projects = self.get_all_projects()
        user_projects = []
        
        for project in all_projects:
            if project.id in user.projects:
                user_projects.append(project)
        
        return user_projects
    
    def get_project_by_id(self, project_id: str) -> Project:
        """Obtener un proyecto específico por ID"""
        projects = self.get_all_projects()
        
        for project in projects:
            if project.id == project_id:
                return project
        
        return None