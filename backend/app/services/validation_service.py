# backend/app/services/validation_service.py
import os
import json
import time
import random
from typing import List
from app.models.import_models import (
    FileValidation, ValidationResult, ValidationStatus, FileMetadata
)

class ValidationService:
    def __init__(self):
        self.simulation_data_path = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'validation_responses.json'
        )
    
    def _load_simulation_data(self) -> dict:
        """Cargar datos de simulación desde archivo JSON"""
        try:
            with open(self.simulation_data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return self._get_default_simulation_data()
    
    def _get_default_simulation_data(self) -> dict:
        """Datos de simulación por defecto"""
        return {
            "validation_templates": {
                "libro_diario_success": {
                    "status": "ok",
                    "validations": [
                        {
                            "field": "fecha",
                            "status": "ok",
                            "message": "Formato de fecha válido",
                            "details": "Todas las fechas están en formato correcto"
                        },
                        {
                            "field": "debe_haber",
                            "status": "ok",
                            "message": "Suma cero verificada",
                            "details": "Todos los asientos cuadran correctamente"
                        },
                        {
                            "field": "cuentas",
                            "status": "ok",
                            "message": "Estructura de cuentas válida",
                            "details": "Plan contable correcto"
                        },
                        {
                            "field": "importes",
                            "status": "ok",
                            "message": "Importes numéricos válidos",
                            "details": "Todos los importes son numéricos"
                        }
                    ]
                },
                "libro_diario_warning": {
                    "status": "warning",
                    "validations": [
                        {
                            "field": "fecha",
                            "status": "ok",
                            "message": "Formato de fecha válido",
                            "details": "Todas las fechas están en formato correcto"
                        },
                        {
                            "field": "debe_haber",
                            "status": "warning",
                            "message": "Algunos asientos con diferencias menores",
                            "details": "3 asientos con diferencias menores a 0.01€"
                        },
                        {
                            "field": "cuentas",
                            "status": "ok",
                            "message": "Estructura de cuentas válida",
                            "details": "Plan contable correcto"
                        },
                        {
                            "field": "importes",
                            "status": "warning",
                            "message": "Algunos importes con formato irregular",
                            "details": "5 registros con más de 2 decimales"
                        }
                    ]
                },
                "libro_diario_error": {
                    "status": "error",
                    "validations": [
                        {
                            "field": "fecha",
                            "status": "error",
                            "message": "Formato de fecha inválido",
                            "details": "15 registros con formato de fecha incorrecto"
                        },
                        {
                            "field": "debe_haber",
                            "status": "error",
                            "message": "Asientos descuadrados",
                            "details": "8 asientos no cuadran - diferencia total: 125.50€"
                        },
                        {
                            "field": "cuentas",
                            "status": "ok",
                            "message": "Estructura de cuentas válida",
                            "details": "Plan contable correcto"
                        },
                        {
                            "field": "importes",
                            "status": "error",
                            "message": "Importes no numéricos encontrados",
                            "details": "12 registros con texto en lugar de números"
                        }
                    ]
                }
            }
        }
    
    def _determine_file_origin(self, filename: str) -> str:
        """Determinar el origen del archivo basado en el nombre"""
        filename_lower = filename.lower()
        if 'sumas' in filename_lower and 'saldos' in filename_lower:
            return "sumas_saldos"
        elif 'libro' in filename_lower and 'diario' in filename_lower:
            return "libro_diario"
        else:
            # Por defecto, asumir libro diario
            return "libro_diario"
    
    def _simulate_validation_delay(self):
        """Simular tiempo de procesamiento"""
        time.sleep(random.uniform(1, 3))  # Entre 1 y 3 segundos
    
    def _choose_validation_result(self) -> str:
        """Elegir resultado de validación aleatoriamente"""
        # 60% éxito, 30% warning, 10% error
        rand = random.random()
        if rand < 0.6:
            return "libro_diario_success"
        elif rand < 0.9:
            return "libro_diario_warning"
        else:
            return "libro_diario_error"
    
    def validate_file(self, metadata: FileMetadata) -> FileValidation:
        """Simular validación de archivo"""
        
        # Simular tiempo de procesamiento
        self._simulate_validation_delay()
        
        # Cargar datos de simulación
        simulation_data = self._load_simulation_data()
        
        # Elegir resultado de validación
        validation_key = self._choose_validation_result()
        validation_template = simulation_data["validation_templates"][validation_key]
        
        # Crear resultados de validación
        validation_results = []
        error_count = 0
        warning_count = 0
        
        for validation in validation_template["validations"]:
            result = ValidationResult(
                field=validation["field"],
                status=ValidationStatus(validation["status"]),
                message=validation["message"],
                details=validation.get("details")
            )
            validation_results.append(result)
            
            if result.status == ValidationStatus.ERROR:
                error_count += 1
            elif result.status == ValidationStatus.WARNING:
                warning_count += 1
        
        # Determinar estado general
        overall_status = ValidationStatus.OK
        if error_count > 0:
            overall_status = ValidationStatus.ERROR
        elif warning_count > 0:
            overall_status = ValidationStatus.WARNING
        
        # Crear validación de archivo
        file_validation = FileValidation(
            fileName=metadata.originalFileName,
            fileType=metadata.fileType.value,
            origin=self._determine_file_origin(metadata.originalFileName),
            status=overall_status,
            validationsPerformed=len(validation_results),
            totalValidations=len(validation_results),
            validationResults=validation_results,
            errorCount=error_count,
            warningCount=warning_count
        )
        
        return file_validation
    
    def validate_files(self, metadatas: List[FileMetadata]) -> List[FileValidation]:
        """Validar múltiples archivos"""
        validations = []
        
        for metadata in metadatas:
            validation = self.validate_file(metadata)
            validations.append(validation)
        
        return validations
    
    def can_proceed_to_conversion(self, validations: List[FileValidation]) -> bool:
        """Determinar si se puede proceder a la conversión"""
        # Solo proceder si no hay errores críticos
        for validation in validations:
            if validation.status == ValidationStatus.ERROR:
                return False
        return True