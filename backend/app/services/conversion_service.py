# backend/app/services/conversion_service.py
import os
import json
import time
import random
from typing import List, Dict, Any
from app.models.import_models import FileMetadata, ExecutionStatus
from app.services.sap_merge_service import SAPMergeService

class ConversionService:
    def __init__(self):
        self.storage_path = os.path.join(os.path.dirname(__file__), '..', 'storage')
        self.converted_files_path = os.path.join(self.storage_path, 'converted')
        self.simulation_data_path = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'conversion_templates.json'
        )
        self.sap_merge_service = SAPMergeService()
        
        # Crear directorio si no existe
        os.makedirs(self.converted_files_path, exist_ok=True)
    
    def _load_conversion_templates(self) -> dict:
        """Cargar plantillas de conversión simuladas"""
        try:
            with open(self.simulation_data_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return self._get_default_conversion_templates()
    
    def _get_default_conversion_templates(self) -> dict:
        """Plantillas de conversión por defecto"""
        return {
            "libro_diario_standard": {
                "headers": [
                    "fecha", "asiento", "cuenta", "subcuenta", 
                    "descripcion", "debe", "haber", "documento", "referencia"
                ],
                "sample_data": [
                    ["2024-01-01", "1", "100000", "1000000001", "Apertura ejercicio", "10000.00", "0.00", "AP001", "REF001"],
                    ["2024-01-01", "1", "200000", "2000000001", "Apertura ejercicio", "0.00", "10000.00", "AP001", "REF001"],
                    ["2024-01-02", "2", "430000", "4300000001", "Venta productos", "1000.00", "0.00", "FV001", "REF002"],
                    ["2024-01-02", "2", "700000", "7000000001", "Venta productos", "0.00", "826.45", "FV001", "REF002"],
                    ["2024-01-02", "2", "477000", "4770000001", "IVA repercutido", "0.00", "173.55", "FV001", "REF002"]
                ]
            },
            "sumas_saldos_standard": {
                "headers": [
                    "cuenta", "descripcion", "saldo_inicial_debe", 
                    "saldo_inicial_haber", "movimientos_debe", 
                    "movimientos_haber", "saldo_final_debe", "saldo_final_haber"
                ],
                "sample_data": [
                    ["100000", "Fondos propios", "10000.00", "0.00", "5000.00", "2000.00", "13000.00", "0.00"],
                    ["200000", "Inmovilizado", "0.00", "10000.00", "1000.00", "500.00", "0.00", "9500.00"],
                    ["430000", "Clientes", "0.00", "0.00", "15000.00", "12000.00", "3000.00", "0.00"],
                    ["700000", "Ventas", "0.00", "0.00", "0.00", "25000.00", "0.00", "25000.00"]
                ]
            }
        }
    
    def _simulate_conversion_delay(self):
        """Simular tiempo de conversión"""
        time.sleep(random.uniform(2, 5))  # Entre 2 y 5 segundos
    
    def _determine_conversion_template(self, filename: str) -> str:
        """Determinar qué plantilla de conversión usar"""
        filename_lower = filename.lower()
        if 'sumas' in filename_lower and 'saldos' in filename_lower:
            return "sumas_saldos_standard"
        else:
            return "libro_diario_standard"
    
    def _generate_converted_filename(self, execution_id: str, original_filename: str) -> str:
        """Generar nombre para archivo convertido"""
        base_name = original_filename.rsplit('.', 1)[0]
        return f"{execution_id}_{base_name}_converted.json"
    
    def _save_converted_file(self, filename: str, data: dict) -> str:
        """Guardar archivo convertido"""
        file_path = os.path.join(self.converted_files_path, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return file_path

    def convert_files_with_merge(self, metadatas: List[FileMetadata]) -> List[Dict[str, Any]]:
        """Convertir múltiples archivos con merge automático de SAP"""
        converted_files = []
        
        try:
            print(f"🔄 Converting {len(metadatas)} files...")
            
            # Verificar si son archivos SAP
            has_sap_files = any(
                'bkpf' in metadata.originalFileName.lower() or 
                'bseg' in metadata.originalFileName.lower() 
                for metadata in metadatas
            )
            
            if has_sap_files and len(metadatas) > 1:
                print("📋 Detected SAP files, performing merge...")
                # Procesar archivos SAP con merge
                merge_result = self.sap_merge_service.process_sap_files(metadatas)
                
                if merge_result["success"]:
                    # Generar archivo consolidado
                    execution_id = metadatas[0].executionId
                    converted_filename = f"{execution_id}_libro_diario_merged.json"
                    
                    file_path = self._save_converted_file(converted_filename, merge_result["data"])
                    
                    converted_files.append({
                        "filename": converted_filename,
                        "filepath": file_path,
                        "data": merge_result["data"],
                        "success": True,
                        "summary": merge_result.get("summary", {})
                    })
                    print(f"✅ SAP merge completed: {converted_filename}")
                else:
                    # Si falla el merge, intentar conversión individual
                    print("⚠️ SAP merge failed, falling back to individual conversion")
                    for metadata in metadatas:
                        try:
                            result = self.convert_file(metadata)
                            converted_files.append(result)
                        except Exception as e:
                            converted_files.append({
                                "filename": metadata.originalFileName,
                                "filepath": None,
                                "data": None,
                                "success": False,
                                "error": str(e)
                            })
            else:
                # Conversión individual para archivos no-SAP o archivo único
                print("📄 Processing files individually...")
                for metadata in metadatas:
                    try:
                        result = self.convert_file(metadata)
                        converted_files.append(result)
                    except Exception as e:
                        converted_files.append({
                            "filename": metadata.originalFileName,
                            "filepath": None,
                            "data": None,
                            "success": False,
                            "error": str(e)
                        })
            
            return converted_files
            
        except Exception as e:
            print(f"❌ Error in convert_files_with_merge: {str(e)}")
            # Fallback a conversión individual
            for metadata in metadatas:
                try:
                    result = self.convert_file(metadata)
                    converted_files.append(result)
                except Exception as individual_error:
                    converted_files.append({
                        "filename": metadata.originalFileName,
                        "filepath": None,
                        "data": None,
                        "success": False,
                        "error": str(individual_error)
                    })
            
            return converted_files
    
    def convert_file(self, metadata: FileMetadata) -> Dict[str, Any]:
        """Simular conversión de archivo a formato estándar"""
        
        # Simular tiempo de procesamiento
        self._simulate_conversion_delay()
        
        # Cargar plantillas
        templates = self._load_conversion_templates()
        
        # Determinar plantilla a usar
        template_key = self._determine_conversion_template(metadata.originalFileName)
        template = templates[template_key]
        
        # Generar datos simulados (más registros)
        converted_data = {
            "metadata": {
                "execution_id": metadata.executionId,
                "original_filename": metadata.originalFileName,
                "conversion_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "format": "standard_accounting",
                "total_records": random.randint(100, 1000)
            },
            "headers": template["headers"],
            "data": template["sample_data"]
        }
        
        # Generar más datos aleatorios para simular un archivo real
        for i in range(10):  # Agregar más registros simulados
            if template_key == "libro_diario_standard":
                new_record = [
                    f"2024-01-{random.randint(1, 28):02d}",
                    str(random.randint(1, 100)),
                    str(random.randint(100000, 999999)),
                    str(random.randint(1000000000, 9999999999)),
                    f"Operación simulada {i+1}",
                    f"{random.randint(100, 10000)}.{random.randint(10, 99)}",
                    "0.00" if random.random() > 0.5 else f"{random.randint(100, 5000)}.{random.randint(10, 99)}",
                    f"DOC{random.randint(1000, 9999)}",
                    f"REF{random.randint(1000, 9999)}"
                ]
            else:  # sumas_saldos_standard
                debe_inicial = random.randint(0, 10000)
                haber_inicial = random.randint(0, 10000)
                mov_debe = random.randint(0, 5000)
                mov_haber = random.randint(0, 5000)
                
                new_record = [
                    str(random.randint(100000, 999999)),
                    f"Cuenta simulada {i+1}",
                    f"{debe_inicial}.00",
                    f"{haber_inicial}.00",
                    f"{mov_debe}.00",
                    f"{mov_haber}.00",
                    f"{debe_inicial + mov_debe - mov_haber if debe_inicial + mov_debe > mov_haber else 0}.00",
                    f"{haber_inicial + mov_haber - mov_debe if haber_inicial + mov_haber > mov_debe else 0}.00"
                ]
            
            converted_data["data"].append(new_record)
        
        # Actualizar total de registros
        converted_data["metadata"]["total_records"] = len(converted_data["data"])
        
        # Guardar archivo convertido
        converted_filename = self._generate_converted_filename(
            metadata.executionId, 
            metadata.originalFileName
        )
        
        file_path = self._save_converted_file(converted_filename, converted_data)
        
        return {
            "filename": converted_filename,
            "filepath": file_path,
            "data": converted_data,
            "success": True
        }
    
    def convert_files(self, metadatas: List[FileMetadata]) -> List[Dict[str, Any]]:
        """Convertir múltiples archivos (versión anterior - mantener compatibilidad)"""
        return self.convert_files_with_merge(metadatas)
    
    def get_converted_file_data(self, execution_id: str, filename: str) -> Dict[str, Any]:
        """Obtener datos de archivo convertido para visualización"""
        file_path = os.path.join(self.converted_files_path, filename)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return None
    
    def get_download_url(self, filename: str) -> str:
        """Generar URL de descarga (simulada)"""
        return f"/api/import/download/{filename}"