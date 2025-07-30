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
    
    def _save_file(self, file: UploadFile, execution_id: str, file_index: int = 0) -> tuple[str, int]:
        """Guardar archivo físico y retornar ruta y tamaño"""
        # Generar nombre único para el archivo
        file_extension = file.filename.split('.')[-1]
        if file_index == 0:
            saved_filename = f"{execution_id}_{file.filename}"
        else:
            # Para múltiples archivos, agregar índice
            base_name = file.filename.rsplit('.', 1)[0]
            saved_filename = f"{execution_id}_{base_name}_{file_index}.{file_extension}"
        
        file_path = os.path.join(self.files_path, saved_filename)
        
        # Guardar archivo
        file_size = 0
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
            file_size = len(content)
        
        return file_path, file_size
    
    def _save_metadata(self, metadata: FileMetadata, file_index: int = 0) -> None:
        """Guardar metadata en archivo JSON"""
        if file_index == 0:
            metadata_file = os.path.join(
                self.metadata_path, 
                f"{metadata.executionId}_metadata.json"
            )
        else:
            metadata_file = os.path.join(
                self.metadata_path, 
                f"{metadata.executionId}_metadata_{file_index}.json"
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

    def upload_multiple_files(
        self, 
        files: List[UploadFile], 
        project_id: str,
        period: str,
        user_id: str,
        user_name: str,
        test_type: str = "libro_diario_import"
    ) -> tuple[str, List[FileMetadata]]:
        """Subir múltiples archivos y generar metadatas"""
        
        execution_id = self._generate_execution_id()
        metadatas = []
        
        for index, file in enumerate(files):
            file_type = self._get_file_type(file.filename)
            
            # Obtener la versión para este archivo y proyecto
            version = self._get_next_version(project_id, file.filename)
            
            # Guardar archivo físico
            file_path, file_size = self._save_file(file, execution_id, index)
            
            # Crear metadata
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
            self._save_metadata(metadata, index)
            metadatas.append(metadata)
        
        return execution_id, metadatas
    
    def upload_file(
        self, 
        file: UploadFile, 
        project_id: str,
        period: str,
        user_id: str,
        user_name: str,
        test_type: str = "libro_diario_import"
    ) -> tuple[str, FileMetadata]:
        """Subir archivo único (compatibilidad con versión anterior)"""
        
        execution_id, metadatas = self.upload_multiple_files(
            [file], project_id, period, user_id, user_name, test_type
        )
        
        return execution_id, metadatas[0]
    
    def create_execution_record(
        self, 
        execution_id: str, 
        metadatas: List[FileMetadata],
        project_name: str
    ) -> None:
        """Crear registro de ejecución en el historial para múltiples archivos"""
        
        # Usar el primer metadata como principal
        primary_metadata = metadatas[0]
        
        # Clasificar archivos por tipo
        libro_diario_files = []
        sumas_saldos_files = []
        
        for metadata in metadatas:
            filename_lower = metadata.originalFileName.lower()
            if 'bkpf' in filename_lower or 'bseg' in filename_lower or 'libro' in filename_lower:
                libro_diario_files.append(metadata.originalFileName)
            elif 'sumas' in filename_lower and 'saldos' in filename_lower:
                sumas_saldos_files.append(metadata.originalFileName)
            else:
                # Por defecto, considerar libro diario
                libro_diario_files.append(metadata.originalFileName)
        
        execution = ImportExecution(
            executionId=execution_id,
            projectId=primary_metadata.projectId,
            projectName=project_name,
            testType=primary_metadata.testType,
            period=primary_metadata.period,
            userId=primary_metadata.userId,
            userName=primary_metadata.userName,
            executionDate=primary_metadata.uploadDate,
            status=primary_metadata.status,
            version=primary_metadata.version,
            libroDiarioFile=', '.join(libro_diario_files) if libro_diario_files else None,
            sumasSaldosFile=', '.join(sumas_saldos_files) if sumas_saldos_files else None
        )
        
        # Cargar ejecuciones existentes
        executions = self._load_executions()
        
        # Agregar nueva ejecución
        executions.append(execution)
        
        # Guardar actualizado
        self._save_executions(executions)
    
    def create_execution_record_single(
        self, 
        execution_id: str, 
        metadata: FileMetadata,
        project_name: str
    ) -> None:
        """Crear registro de ejecución para un solo archivo (compatibilidad)"""
        self.create_execution_record(execution_id, [metadata], project_name)
    
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
        
        # También actualizar todas las metadatas
        metadatas = self.get_metadatas_by_execution_id(execution_id)
        for metadata in metadatas:
            metadata.status = status
            # Guardar metadata actualizada (necesitaríamos el índice)
    
    def get_metadata_by_execution_id(self, execution_id: str) -> Optional[FileMetadata]:
        """Obtener metadata principal por ID de ejecución"""
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
    
    def get_metadatas_by_execution_id(self, execution_id: str) -> List[FileMetadata]:
        """Obtener todas las metadatas por ID de ejecución"""
        metadatas = []
        
        # Buscar metadata principal
        main_metadata = self.get_metadata_by_execution_id(execution_id)
        if main_metadata:
            metadatas.append(main_metadata)
        
        # Buscar metadatas adicionales
        index = 1
        while True:
            try:
                metadata_file = os.path.join(
                    self.metadata_path, 
                    f"{execution_id}_metadata_{index}.json"
                )
                
                if os.path.exists(metadata_file):
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        metadatas.append(FileMetadata(**data))
                    index += 1
                else:
                    break
            except Exception:
                break
        
        return metadatas
    
    def get_execution_by_id(self, execution_id: str) -> Optional[ImportExecution]:
        """Obtener ejecución específica por ID"""
        executions = self._load_executions()
        
        for execution in executions:
            if execution.executionId == execution_id:
                return execution
        
        return None
    
    def get_execution_details(self, execution_id: str) -> Optional[dict]:
        """Obtener detalles completos de una ejecución incluyendo todas las metadatas"""
        execution = self.get_execution_by_id(execution_id)
        if not execution:
            return None
            
        metadatas = self.get_metadatas_by_execution_id(execution_id)
        
        return {
            "execution": execution.dict(),
            "metadatas": [metadata.dict() for metadata in metadatas],
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
                "convertedName": f"{execution_id}_libro_diario_merged.json",
                "description": "Libro Diario consolidado en formato estándar JSON"
            })
            
        if execution.sumasSaldosFile and execution.status == ExecutionStatus.SUCCESS:
            files.append({
                "type": "sumas_saldos", 
                "originalName": execution.sumasSaldosFile,
                "convertedName": f"{execution_id}_sumas_saldos_converted.json",
                "description": "Sumas y Saldos en formato estándar JSON"
            })
        
        return files