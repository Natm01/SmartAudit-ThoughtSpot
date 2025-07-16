# backend/app/services/upload_service.py
import os
import json
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import UploadFile
from app.models.import_models import (
    FileMetadata, ImportExecution, ExecutionStatus, FileType
)

class UploadService:
    def __init__(self):
        self.storage_path = os.path.join(os.path.dirname(__file__), '..', 'storage')
        self.metadata_path = os.path.join(self.storage_path, 'metadata')
        self.files_path = os.path.join(self.storage_path, 'files')
        self.executions_file = os.path.join(self.storage_path, 'executions.json')
        
        # Crear directorios si no existen
        os.makedirs(self.metadata_path, exist_ok=True)
        os.makedirs(self.files_path, exist_ok=True)
    
    def _generate_execution_id(self) -> str:
        """Generar un ID único para la ejecución"""
        return str(uuid.uuid4())[:8]
    
    def _get_file_type(self, filename: str) -> FileType:
        """Determinar el tipo de archivo basado en la extensión"""
        extension = filename.lower().split('.')[-1]
        try:
            return FileType(extension)
        except ValueError:
            return FileType.CSV  # Por defecto
    
    def _get_next_version(self, project_id: str, filename: str) -> int:
        """Obtener la siguiente versión para un archivo en un proyecto específico"""
        executions = self._load_executions()
        versions = []
        
        for execution in executions:
            if (execution.projectId == project_id and 
                (execution.libroDiarioFile == filename or execution.sumasSaldosFile == filename)):
                # Buscar versión en metadata
                metadata = self.get_metadata_by_execution_id(execution.executionId)
                if metadata:
                    versions.append(metadata.version)
        
        if not versions:
            return 1
        return max(versions) + 1
    
    def _save_file(self, file: UploadFile, execution_id: str) -> tuple[str, int]:
        """Guardar archivo físico y retornar ruta y tamaño"""
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1]
        saved_filename = f"{execution_id}_{file.filename}"
        file_path = os.path.join(self.files_path, saved_filename)
        
        # Guardar archivo
        file_size = 0
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
            file_size = len(content)
        
        return file_path, file_size
    
    def _save_metadata(self, metadata: FileMetadata) -> None:
        """Guardar metadata en archivo JSON"""
        metadata_file = os.path.join(
            self.metadata_path, 
            f"{metadata.executionId}_metadata.json"
        )
        
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata.dict(), f, ensure_ascii=False, indent=2)
    
    def _load_executions(self) -> List[ImportExecution]:
        """Cargar historial de ejecuciones"""
        try:
            if os.path.exists(self.executions_file):
                with open(self.executions_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return [ImportExecution(**exec_data) for exec_data in data.get('executions', [])]
            return []
        except Exception:
            return []
    
    def _save_executions(self, executions: List[ImportExecution]) -> None:
        """Guardar historial de ejecuciones"""
        try:
            data = {
                'executions': [execution.dict() for execution in executions],
                'lastUpdated': datetime.now().isoformat()
            }
            with open(self.executions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving executions: {e}")
    
    def upload_file(
        self, 
        file: UploadFile, 
        project_id: str,
        period: str,
        user_id: str,
        user_name: str,
        test_type: str = "libro_diario_import"
    ) -> tuple[str, FileMetadata]:
        """Subir archivo y generar metadata"""
        
        execution_id = self._generate_execution_id()
        file_type = self._get_file_type(file.filename)
        
        # Obtener la versión para este archivo y proyecto
        version = self._get_next_version(project_id, file.filename)
        
        # Guardar archivo físico
        file_path, file_size = self._save_file(file, execution_id)
        
        # Crear metadata con proyecto y versión
        metadata = FileMetadata(
            executionId=execution_id,
            projectId=project_id,
            testType=test_type,
            period=period,
            version=version,
            originalFileName=file.filename,
            fileType=file_type,
            fileSize=file_size,
            uploadDate=datetime.now().isoformat(),
            userId=user_id,
            userName=user_name,
            status=ExecutionStatus.PENDING,
            filePath=file_path
        )
        
        # Guardar metadata
        self._save_metadata(metadata)
        
        return execution_id, metadata
    
    def create_execution_record(
        self, 
        execution_id: str, 
        metadata: FileMetadata,
        project_name: str
    ) -> None:
        """Crear registro de ejecución en el historial"""
        
        execution = ImportExecution(
            executionId=execution_id,
            projectId=metadata.projectId,
            projectName=project_name,
            testType=metadata.testType,
            period=metadata.period,
            userId=metadata.userId,
            userName=metadata.userName,
            executionDate=metadata.uploadDate,
            status=metadata.status,
            version=metadata.version,  # Incluir versión correctamente
            libroDiarioFile=metadata.originalFileName if 'libro' in metadata.originalFileName.lower() else None,
            sumasSaldosFile=metadata.originalFileName if 'sumas' in metadata.originalFileName.lower() else None
        )
        
        # Cargar ejecuciones existentes
        executions = self._load_executions()
        
        # Agregar nueva ejecución
        executions.append(execution)
        
        # Guardar actualizado
        self._save_executions(executions)
    
    def get_execution_history(self, user_id: str = None) -> List[ImportExecution]:
        """Obtener historial de ejecuciones"""
        executions = self._load_executions()
        
        if user_id:
            # Filtrar por usuario si se especifica
            executions = [exec for exec in executions if exec.userId == user_id]
        
        # Ordenar por fecha más reciente
        executions.sort(key=lambda x: x.executionDate, reverse=True)
        
        return executions
    
    def update_execution_status(
        self, 
        execution_id: str, 
        status: ExecutionStatus,
        error_message: str = None
    ) -> None:
        """Actualizar estado de una ejecución"""
        executions = self._load_executions()
        
        for execution in executions:
            if execution.executionId == execution_id:
                execution.status = status
                if error_message:
                    execution.errorMessage = error_message
                break
        
        self._save_executions(executions)
        
        # También actualizar metadata
        metadata = self.get_metadata_by_execution_id(execution_id)
        if metadata:
            metadata.status = status
            self._save_metadata(metadata)
    
    def get_metadata_by_execution_id(self, execution_id: str) -> Optional[FileMetadata]:
        """Obtener metadata por ID de ejecución"""
        try:
            metadata_file = os.path.join(
                self.metadata_path, 
                f"{execution_id}_metadata.json"
            )
            
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return FileMetadata(**data)
            return None
        except Exception:
            return None
    
    def get_execution_by_id(self, execution_id: str) -> Optional[ImportExecution]:
        """Obtener ejecución específica por ID"""
        executions = self._load_executions()
        
        for execution in executions:
            if execution.executionId == execution_id:
                return execution
        
        return None
    
    def get_execution_details(self, execution_id: str) -> Optional[dict]:
        """Obtener detalles completos de una ejecución incluyendo metadata"""
        execution = self.get_execution_by_id(execution_id)
        if not execution:
            return None
            
        metadata = self.get_metadata_by_execution_id(execution_id)
        
        return {
            "execution": execution.dict(),
            "metadata": metadata.dict() if metadata else None,
            "canDownload": execution.status == ExecutionStatus.SUCCESS,
            "availableFiles": self._get_available_files(execution_id, execution)
        }
    
    def _get_available_files(self, execution_id: str, execution: ImportExecution) -> List[dict]:
        """Obtener lista de archivos disponibles para descarga"""
        files = []
        
        if execution.libroDiarioFile and execution.status == ExecutionStatus.SUCCESS:
            files.append({
                "type": "libro_diario",
                "originalName": execution.libroDiarioFile,
                "convertedName": f"{execution_id}_libro_diario_converted.json",
                "description": "Libro Diario en formato estándar JSON"
            })
            
        if execution.sumasSaldosFile and execution.status == ExecutionStatus.SUCCESS:
            files.append({
                "type": "sumas_saldos", 
                "originalName": execution.sumasSaldosFile,
                "convertedName": f"{execution_id}_sumas_saldos_converted.json",
                "description": "Sumas y Saldos en formato estándar JSON"
            })
        
        return files