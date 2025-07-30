# backend/app/services/sap_merge_service.py
import os
import re
import pandas as pd
from typing import List, Dict, Any, Optional
from app.models.import_models import FileMetadata

class SAPMergeService:
    def __init__(self):
        pass
    
    def parse_sap_file(self, file_path: str, file_type: str) -> pd.DataFrame:
        """Parsear archivo SAP (BKPF o BSEG) a DataFrame"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            if file_type.upper() == 'BKPF':
                return self._parse_bkpf_content(content)
            elif file_type.upper() == 'BSEG':
                return self._parse_bseg_content(content)
            else:
                raise ValueError(f"Tipo de archivo SAP no soportado: {file_type}")
                
        except Exception as e:
            print(f"Error parsing SAP file {file_path}: {str(e)}")
            return pd.DataFrame()
    
    def _parse_bkpf_content(self, content: str) -> pd.DataFrame:
        """Parsear contenido del archivo BKPF (cabeceras de documento)"""
        lines = content.split('\n')
        data = []
        
        # Buscar líneas que contengan datos (ignorar cabeceras y separadores)
        for line in lines:
            # Verificar si la línea contiene datos de BKPF
            if '|  OIVE|' in line and not line.startswith('---'):
                parts = [part.strip() for part in line.split('|')]
                if len(parts) >= 13:  # Verificar que tiene suficientes columnas
                    try:
                        record = {
                            'sociedad': parts[1],
                            'ejercicio': parts[2],
                            'numero_documento': parts[3],
                            'fecha_contabilizacion': self._parse_date(parts[4]),
                            'fecha_entrada': self._parse_date(parts[5]),
                            'hora': parts[6],
                            'usuario': parts[7],
                            'texto_cabecera': parts[8],
                            'moneda': parts[9],
                            'indicador_storno': parts[10],
                            'codigo_transaccion': parts[11],
                            'documento_anulacion': parts[12],
                            'clase_documento': parts[13] if len(parts) > 13 else '',
                            'fecha_documento': self._parse_date(parts[14]) if len(parts) > 14 else '',
                            'ultima_actualizacion': parts[15] if len(parts) > 15 else ''
                        }
                        data.append(record)
                    except Exception as e:
                        print(f"Error parsing BKPF line: {line[:100]}... - {str(e)}")
                        continue
        
        print(f"Parsed {len(data)} BKPF records")
        return pd.DataFrame(data)
    
    def _parse_bseg_content(self, content: str) -> pd.DataFrame:
        """Parsear contenido del archivo BSEG (posiciones de documento) - VERSIÓN CORREGIDA"""
        lines = content.split('\n')
        data = []
        
        # Buscar líneas que contengan datos
        for line in lines:
            # Verificar si la línea contiene datos de BSEG y no es una línea de separación
            if '|  OIVE|' in line and not line.startswith('---'):
                parts = [part.strip() for part in line.split('|')]
                
                # Debug: mostrar la línea que estamos parseando
                print(f"Parsing BSEG line with {len(parts)} parts: {line[:150]}...")
                
                if len(parts) >= 14:  # Verificar que tiene suficientes columnas
                    try:
                        # Mapear según el formato de tu archivo BSEG
                        # |  Soc.| Año|Nº doc.   |Pos|D/H|    Importe ML|       Importe|Lib.mayor |Texto|Compens.|Fe.comp.|Doc.comp.|Acreedor|CT|
                        record = {
                            'sociedad': parts[1],           # Soc.
                            'ejercicio': parts[2],          # Año
                            'numero_documento': parts[3],   # Nº doc.
                            'posicion': parts[4],           # Pos
                            'indicador_debe_haber': parts[5], # D/H
                            'importe_moneda_local': self._parse_amount(parts[6]), # Importe ML
                            'importe': self._parse_amount(parts[7]),              # Importe
                            'cuenta_mayor': parts[8],       # Lib.mayor
                            'texto_posicion': parts[9],     # Texto
                            'documento_compensacion': parts[10], # Compens.
                            'fecha_compensacion': self._parse_date(parts[11]),   # Fe.comp.
                            'numero_compensacion': parts[12],    # Doc.comp.
                            'acreedor': parts[13],          # Acreedor
                            'codigo_tipo': parts[14] if len(parts) > 14 else ''  # CT
                        }
                        data.append(record)
                        print(f"✓ Successfully parsed BSEG record: {record['numero_documento']}-{record['posicion']}")
                    except Exception as e:
                        print(f"Error parsing BSEG line: {line[:100]}... - {str(e)}")
                        continue
                else:
                    print(f"Skipping line with insufficient columns ({len(parts)}): {line[:100]}...")
        
        print(f"Parsed {len(data)} BSEG records")
        return pd.DataFrame(data)
    
    def _parse_date(self, date_str: str) -> str:
        """Convertir fecha de formato SAP a formato estándar"""
        if not date_str or date_str.strip() == '' or date_str.strip() == '':
            return ''
        
        try:
            # SAP format: DD.MM.YYYY
            date_str = date_str.strip()
            if re.match(r'\d{2}\.\d{2}\.\d{4}', date_str):
                day, month, year = date_str.split('.')
                return f"{year}-{month}-{day}"
            return date_str
        except:
            return date_str
    
    def _parse_amount(self, amount_str: str) -> float:
        """Convertir importe de formato SAP a float"""
        if not amount_str or amount_str.strip() == '':
            return 0.0
        
        try:
            # Limpiar formato SAP 
            # Tu formato parece ser: "    12,00 " con comas como separador decimal
            amount_str = amount_str.strip()
            
            # Si contiene coma, es separador decimal
            if ',' in amount_str:
                # Remover espacios y convertir coma a punto
                amount_str = amount_str.replace(' ', '').replace(',', '.')
            else:
                # Solo remover espacios
                amount_str = amount_str.replace(' ', '')
            
            return float(amount_str)
        except Exception as e:
            print(f"Error parsing amount '{amount_str}': {str(e)}")
            return 0.0
    
    def merge_bkpf_bseg(self, bkpf_df: pd.DataFrame, bseg_df: pd.DataFrame) -> pd.DataFrame:
        """Combinar DataFrames de BKPF y BSEG para crear libro diario"""
        try:
            if bkpf_df.empty or bseg_df.empty:
                print("Warning: One of the DataFrames is empty")
                if not bseg_df.empty:
                    return self._create_libro_from_bseg_only(bseg_df)
                return pd.DataFrame()
            
            print(f"Merging {len(bkpf_df)} BKPF records with {len(bseg_df)} BSEG records")
            
            # Asegurar que los campos de merge tienen el mismo tipo
            bkpf_df['numero_documento'] = bkpf_df['numero_documento'].astype(str).str.zfill(10)
            bseg_df['numero_documento'] = bseg_df['numero_documento'].astype(str).str.zfill(10)
            
            # Merge por sociedad, ejercicio y número de documento
            merged_df = pd.merge(
                bseg_df, 
                bkpf_df, 
                on=['sociedad', 'ejercicio', 'numero_documento'],
                how='left',
                suffixes=('_pos', '_cab')
            )
            
            print(f"Merged result: {len(merged_df)} records")
            
            # Crear estructura de libro diario estándar
            libro_diario = []
            
            for _, row in merged_df.iterrows():
                # Determinar debe y haber
                debe = row['importe_moneda_local'] if row['indicador_debe_haber'] == 'S' else 0.0
                haber = row['importe_moneda_local'] if row['indicador_debe_haber'] == 'H' else 0.0
                
                registro = {
                    'fecha': row['fecha_contabilizacion'] if pd.notna(row['fecha_contabilizacion']) else '',
                    'asiento': row['numero_documento'],
                    'cuenta': row['cuenta_mayor'],
                    'subcuenta': row['cuenta_mayor'],  # En SAP puede ser la misma
                    'descripcion': row['texto_posicion'] if pd.notna(row['texto_posicion']) else row.get('texto_cabecera', ''),
                    'debe': f"{debe:.2f}",
                    'haber': f"{haber:.2f}",
                    'documento': row['numero_documento'],
                    'referencia': f"{row['sociedad']}-{row['ejercicio']}-{row['posicion']}",
                    'moneda': row.get('moneda', 'EUR'),
                    'usuario': row.get('usuario', ''),
                    'fecha_documento': row.get('fecha_documento', ''),
                    'clase_documento': row.get('clase_documento', '')
                }
                libro_diario.append(registro)
            
            return pd.DataFrame(libro_diario)
            
        except Exception as e:
            print(f"Error merging BKPF and BSEG: {str(e)}")
            return pd.DataFrame()
    
    def _create_libro_from_bseg_only(self, bseg_df: pd.DataFrame) -> pd.DataFrame:
        """Crear libro diario solo con datos BSEG"""
        libro_diario = []
        
        for _, row in bseg_df.iterrows():
            debe = row['importe_moneda_local'] if row['indicador_debe_haber'] == 'S' else 0.0
            haber = row['importe_moneda_local'] if row['indicador_debe_haber'] == 'H' else 0.0
            
            registro = {
                'fecha': row.get('fecha_compensacion', ''),
                'asiento': row['numero_documento'],
                'cuenta': row['cuenta_mayor'],
                'subcuenta': row['cuenta_mayor'],
                'descripcion': row.get('texto_posicion', ''),
                'debe': f"{debe:.2f}",
                'haber': f"{haber:.2f}",
                'documento': row['numero_documento'],
                'referencia': f"{row['sociedad']}-{row['ejercicio']}-{row['posicion']}"
            }
            libro_diario.append(registro)
        
        return pd.DataFrame(libro_diario)
    
    def _create_libro_from_bkpf_only(self, bkpf_df: pd.DataFrame) -> pd.DataFrame:
        """Crear libro diario solo con datos BKPF (limitado)"""
        libro_diario = []
        
        for _, row in bkpf_df.iterrows():
            registro = {
                'fecha': row['fecha_contabilizacion'],
                'asiento': row['numero_documento'],
                'cuenta': '999999',  # Cuenta genérica
                'subcuenta': '999999',
                'descripcion': row['texto_cabecera'],
                'debe': '0.00',
                'haber': '0.00',
                'documento': row['numero_documento'],
                'referencia': f"{row['sociedad']}-{row['ejercicio']}"
            }
            libro_diario.append(registro)
        
        return pd.DataFrame(libro_diario)
    
    def identify_file_type(self, filename: str, file_path: str) -> str:
        """Identificar si el archivo es BKPF o BSEG"""
        filename_upper = filename.upper()
        
        # Identificación por nombre de archivo
        if 'BKPF' in filename_upper:
            return 'BKPF'
        elif 'BSEG' in filename_upper:
            return 'BSEG'
        
        # Identificación por contenido si no está claro por el nombre
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read(2000)  # Leer solo el inicio
                
            # Buscar indicadores de contenido más específicos
            if 'Texto cab.documento' in content or 'Fe.contab.' in content or 'Nombre del usuario' in content:
                return 'BKPF'
            elif 'D/H|' in content or 'Pos|' in content or 'Importe ML' in content:
                return 'BSEG'
                
        except Exception as e:
            print(f"Error reading file for type identification: {str(e)}")
        
        # Por defecto, asumir BSEG si no está claro (porque es más común)
        return 'BSEG'
    
    def process_sap_files(self, metadatas: List[FileMetadata]) -> Dict[str, Any]:
        """Procesar múltiples archivos SAP y generar libro diario consolidado"""
        try:
            bkpf_files = []
            bseg_files = []
            
            # Clasificar archivos
            for metadata in metadatas:
                file_type = self.identify_file_type(metadata.originalFileName, metadata.filePath)
                print(f"File {metadata.originalFileName} identified as {file_type}")
                
                if file_type == 'BKPF':
                    bkpf_files.append(metadata)
                elif file_type == 'BSEG':
                    bseg_files.append(metadata)
            
            print(f"Found {len(bkpf_files)} BKPF files and {len(bseg_files)} BSEG files")
            
            # Procesar archivos BKPF
            bkpf_dfs = []
            for metadata in bkpf_files:
                df = self.parse_sap_file(metadata.filePath, 'BKPF')
                if not df.empty:
                    bkpf_dfs.append(df)
            
            # Procesar archivos BSEG
            bseg_dfs = []
            for metadata in bseg_files:
                df = self.parse_sap_file(metadata.filePath, 'BSEG')
                if not df.empty:
                    bseg_dfs.append(df)
            
            # Combinar todos los BKPF y BSEG
            combined_bkpf = pd.concat(bkpf_dfs, ignore_index=True) if bkpf_dfs else pd.DataFrame()
            combined_bseg = pd.concat(bseg_dfs, ignore_index=True) if bseg_dfs else pd.DataFrame()
            
            print(f"Combined: {len(combined_bkpf)} BKPF records, {len(combined_bseg)} BSEG records")
            
            if combined_bkpf.empty and combined_bseg.empty:
                return {
                    "success": False,
                    "error": "No se pudieron procesar los archivos SAP",
                    "data": None
                }
            
            # Si solo tenemos uno de los dos tipos, intentar procesar lo que tenemos
            if combined_bkpf.empty:
                print("Warning: No BKPF data found, processing BSEG only")
                libro_diario_df = self._create_libro_from_bseg_only(combined_bseg)
            elif combined_bseg.empty:
                print("Warning: No BSEG data found, processing BKPF only")
                libro_diario_df = self._create_libro_from_bkpf_only(combined_bkpf)
            else:
                # Merge normal
                libro_diario_df = self.merge_bkpf_bseg(combined_bkpf, combined_bseg)
            
            if libro_diario_df.empty:
                return {
                    "success": False,
                    "error": "No se pudo generar el libro diario consolidado",
                    "data": None
                }
            
            print(f"Generated libro diario with {len(libro_diario_df)} records")
            
            # Convertir a formato estándar
            standard_data = {
                "metadata": {
                    "total_records": len(libro_diario_df),
                    "bkpf_files": len(bkpf_files),
                    "bseg_files": len(bseg_files),
                    "format": "sap_merged_accounting",
                    "conversion_date": pd.Timestamp.now().isoformat()
                },
                "headers": [
                    "fecha", "asiento", "cuenta", "subcuenta", "descripcion", 
                    "debe", "haber", "documento", "referencia"
                ],
                "data": libro_diario_df.values.tolist()
            }
            
            return {
                "success": True,
                "data": standard_data,
                "summary": {
                    "total_records": len(libro_diario_df),
                    "bkpf_records": len(combined_bkpf) if not combined_bkpf.empty else 0,
                    "bseg_records": len(combined_bseg) if not combined_bseg.empty else 0
                }
            }
            
        except Exception as e:
            print(f"Error processing SAP files: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": f"Error al procesar archivos SAP: {str(e)}",
                "data": None
            }