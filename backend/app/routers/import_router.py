# backend/app/routers/import_router.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from typing import List, Optional
import os

from app.models.import_models import (
    UploadResponse, ValidationResponse, ConversionResponse, 
    ImportHistoryResponse, FilePreview, ExecutionStatus
)
from app.services.upload_service import UploadService
from app.services.validation_service import ValidationService
from app.services.conversion_service import ConversionService
from app.services.user_service import UserService
from app.services.project_service import ProjectService

router = APIRouter()
upload_service = UploadService()
validation_service = ValidationService()
conversion_service = ConversionService()
user_service = UserService()
project_service = ProjectService()

@router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    period: str = Form(...),
    test_type: str = Form("libro_diario_import")
):
    """Subir archivo contable"""
    try:
        # Validar proyecto
        project = project_service.get_project_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=404,
                detail=f"Proyecto {project_id} no encontrado"
            )
        
        # Obtener usuario actual
        user = user_service.get_current_user()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )
        
        # Verificar que el usuario tiene acceso al proyecto
        if project_id not in user.projects:
            raise HTTPException(
                status_code=403,
                detail="No tienes acceso a este proyecto"
            )
        
        # Subir archivo (ya incluye lógica de versionado)
        execution_id, metadata = upload_service.upload_file(
            file=file,
            project_id=project_id,
            period=period,
            user_id=user.id,
            user_name=user.name,
            test_type=test_type
        )
        
        # Crear registro en historial con la información del proyecto
        upload_service.create_execution_record(
            execution_id=execution_id,
            metadata=metadata,
            project_name=project.name
        )
        
        return UploadResponse(
            executionId=execution_id,
            success=True,
            message=f"Archivo subido correctamente (Versión {metadata.version})",
            metadata=metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.post("/validate/{execution_id}", response_model=ValidationResponse)
async def validate_files(execution_id: str):
    """Validar archivos subidos"""
    try:
        # Obtener metadata
        metadata = upload_service.get_metadata_by_execution_id(execution_id)
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        # Actualizar estado a procesando
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.PROCESSING
        )
        
        # Realizar validación
        validation_result = validation_service.validate_file(metadata)
        validations = [validation_result]
        
        # Determinar si se puede proceder
        can_proceed = validation_service.can_proceed_to_conversion(validations)
        
        # Actualizar estado según resultado
        if validation_result.status.value == "error":
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.ERROR,
                "Errores encontrados en la validación"
            )
        elif validation_result.status.value == "warning":
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.WARNING
            )
        else:
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.SUCCESS
            )
        
        return ValidationResponse(
            executionId=execution_id,
            success=True,
            message="Validación completada",
            validations=validations,
            canProceed=can_proceed
        )
        
    except HTTPException:
        raise
    except Exception as e:
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.ERROR,
            str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la validación: {str(e)}"
        )

@router.post("/convert/{execution_id}", response_model=ConversionResponse)
async def convert_files(execution_id: str):
    """Convertir archivos a formato estándar"""
    try:
        # Obtener metadata
        metadata = upload_service.get_metadata_by_execution_id(execution_id)
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        # Actualizar estado a procesando
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.PROCESSING
        )
        
        # Realizar conversión
        conversion_result = conversion_service.convert_file(metadata)
        
        if conversion_result["success"]:
            # URLs de descarga
            download_urls = [
                conversion_service.get_download_url(conversion_result["filename"])
            ]
            
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.SUCCESS
            )
            
            return ConversionResponse(
                executionId=execution_id,
                success=True,
                message="Conversión completada exitosamente",
                convertedFiles=[conversion_result["filename"]],
                downloadUrls=download_urls
            )
        else:
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.ERROR,
                "Error durante la conversión"
            )
            raise HTTPException(
                status_code=500,
                detail="Error durante la conversión"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.ERROR,
            str(e)
        )
        raise HTTPException(
            status_code=500,
            detail=f"Error durante la conversión: {str(e)}"
        )

@router.get("/history", response_model=ImportHistoryResponse)
async def get_import_history():
    """Obtener historial de importaciones"""
    try:
        user = user_service.get_current_user()
        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuario no encontrado"
            )
        
        # Obtener historial (filtrado por usuario actual)
        executions = upload_service.get_execution_history(user.id)
        
        return ImportHistoryResponse(
            executions=executions,
            success=True,
            message="Historial obtenido correctamente"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo historial: {str(e)}"
        )

@router.get("/preview/{execution_id}")
async def preview_converted_file(execution_id: str, filename: str):
    """Previsualizar archivo convertido"""
    try:
        # Obtener datos del archivo convertido
        file_data = conversion_service.get_converted_file_data(execution_id, filename)
        
        if not file_data:
            raise HTTPException(
                status_code=404,
                detail="Archivo no encontrado"
            )
        
        # Limitar a las primeras 10 filas para preview
        preview_data = file_data["data"][:10] if len(file_data["data"]) > 10 else file_data["data"]
        
        return FilePreview(
            fileName=filename,
            headers=file_data["headers"],
            rows=preview_data,
            totalRows=file_data["metadata"]["total_records"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo preview: {str(e)}"
        )

@router.get("/download/{filename}")
async def download_converted_file(filename: str):
    """Descargar archivo convertido"""
    try:
        file_path = os.path.join(
            conversion_service.converted_files_path, 
            filename
        )
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail="Archivo no encontrado"
            )
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/json'
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error descargando archivo: {str(e)}"
        )

@router.get("/execution/{execution_id}")
async def get_execution_details(execution_id: str):
    """Obtener detalles completos de una ejecución"""
    try:
        details = upload_service.get_execution_details(execution_id)
        if not details:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        return {
            "executionId": execution_id,
            "details": details,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo detalles: {str(e)}"
        )

@router.get("/status/{execution_id}")
async def get_execution_status(execution_id: str):
    """Obtener estado de una ejecución"""
    try:
        metadata = upload_service.get_metadata_by_execution_id(execution_id)
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        return {
            "executionId": execution_id,
            "status": metadata.status,
            "version": metadata.version,
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo estado: {str(e)}"
        )