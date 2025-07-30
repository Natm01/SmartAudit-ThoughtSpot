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
async def upload_files(
    files: List[UploadFile] = File(...),  # Cambio: ahora acepta múltiples archivos
    project_id: str = Form(...),
    period: str = Form(...),
    test_type: str = Form("libro_diario_import")
):
    """Subir múltiples archivos contables"""
    try:
        # Validar que se enviaron archivos
        if not files or len(files) == 0:
            raise HTTPException(
                status_code=400,
                detail="Debe enviar al menos un archivo"
            )

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

        # Procesar múltiples archivos
        execution_id, metadatas = upload_service.upload_multiple_files(
            files=files,
            project_id=project_id,
            period=period,
            user_id=user.id,
            user_name=user.name,
            test_type=test_type
        )
        
        # Crear registro en historial
        upload_service.create_execution_record(
            execution_id=execution_id,
            metadatas=metadatas,
            project_name=project.name
        )
        
        # Retornar información del primer archivo (o un resumen)
        primary_metadata = metadatas[0] if metadatas else None
        
        return UploadResponse(
            executionId=execution_id,
            success=True,
            message=f"{len(files)} archivo(s) subido(s) correctamente",
            metadata=primary_metadata
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
        # Obtener metadatas de todos los archivos
        metadatas = upload_service.get_metadatas_by_execution_id(execution_id)
        if not metadatas:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        # Actualizar estado a procesando
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.PROCESSING
        )
        
        # Realizar validación de todos los archivos
        validation_results = validation_service.validate_files(metadatas)
        
        # Determinar si se puede proceder
        can_proceed = validation_service.can_proceed_to_conversion(validation_results)
        
        # Actualizar estado según resultado
        has_errors = any(v.status.value == "error" for v in validation_results)
        has_warnings = any(v.status.value == "warning" for v in validation_results)
        
        if has_errors:
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.ERROR,
                "Errores encontrados en la validación"
            )
        elif has_warnings:
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
            validations=validation_results,
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
    """Convertir archivos a formato estándar con merge de BKPF/BSEG"""
    try:
        # Obtener metadatas
        metadatas = upload_service.get_metadatas_by_execution_id(execution_id)
        if not metadatas:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        # Actualizar estado a procesando
        upload_service.update_execution_status(
            execution_id, 
            ExecutionStatus.PROCESSING
        )
        
        # Realizar conversión con merge de archivos SAP
        conversion_results = conversion_service.convert_files_with_merge(metadatas)
        
        success_count = sum(1 for result in conversion_results if result["success"])
        
        if success_count > 0:
            # URLs de descarga
            download_urls = []
            converted_files = []
            
            for result in conversion_results:
                if result["success"]:
                    converted_files.append(result["filename"])
                    download_urls.append(conversion_service.get_download_url(result["filename"]))
            
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.SUCCESS
            )
            
            return ConversionResponse(
                executionId=execution_id,
                success=True,
                message=f"Conversión completada exitosamente - {success_count} archivo(s) procesado(s)",
                convertedFiles=converted_files,
                downloadUrls=download_urls
            )
        else:
            upload_service.update_execution_status(
                execution_id, 
                ExecutionStatus.ERROR,
                "Error durante la conversión de todos los archivos"
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
        metadatas = upload_service.get_metadatas_by_execution_id(execution_id)
        if not metadatas:
            raise HTTPException(
                status_code=404,
                detail="Ejecución no encontrada"
            )
        
        # Usar el primer metadata para el estado general
        primary_metadata = metadatas[0]
        
        return {
            "executionId": execution_id,
            "status": primary_metadata.status,
            "version": primary_metadata.version,
            "fileCount": len(metadatas),
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error obteniendo estado: {str(e)}"
        )