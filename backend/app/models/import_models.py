# backend/app/models/import_models.py
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class FileType(str, Enum):
    CSV = "csv"
    TXT = "txt"
    XLS = "xls"
    XLSX = "xlsx"

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"

class ValidationStatus(str, Enum):
    OK = "ok"
    ERROR = "error"
    WARNING = "warning"

class ValidationResult(BaseModel):
    field: str
    status: ValidationStatus
    message: str
    details: Optional[str] = None

class FileValidation(BaseModel):
    fileName: str
    fileType: str
    origin: str  # "libro_diario" o "sumas_saldos"
    status: ValidationStatus
    validationsPerformed: int
    totalValidations: int
    validationResults: List[ValidationResult]
    errorCount: int = 0
    warningCount: int = 0

class FileMetadata(BaseModel):
    executionId: str
    projectId: str
    testType: str
    period: str
    version: int
    originalFileName: str
    fileType: FileType
    fileSize: int
    uploadDate: str
    userId: str
    userName: str
    status: ExecutionStatus
    filePath: str

class ImportExecution(BaseModel):
    executionId: str
    projectId: str
    projectName: str
    testType: str
    period: str
    userId: str
    userName: str
    executionDate: str
    status: ExecutionStatus
    version: Optional[int] = 1  # Agregar versión
    libroDiarioFile: Optional[str] = None
    sumasSaldosFile: Optional[str] = None
    validationResults: List[FileValidation] = []
    convertedFiles: List[str] = []
    errorMessage: Optional[str] = None

class UploadRequest(BaseModel):
    projectId: str
    period: str
    testType: str = "libro_diario_import"

class UploadResponse(BaseModel):
    executionId: str
    success: bool
    message: str
    metadata: Optional[FileMetadata] = None

class ValidationResponse(BaseModel):
    executionId: str
    success: bool
    message: str
    validations: List[FileValidation]
    canProceed: bool

class ConversionResponse(BaseModel):
    executionId: str
    success: bool
    message: str
    convertedFiles: List[str]
    downloadUrls: List[str]

class ImportHistoryResponse(BaseModel):
    executions: List[ImportExecution]
    success: bool = True
    message: str = "Historial obtenido correctamente"

class FilePreview(BaseModel):
    fileName: str
    headers: List[str]
    rows: List[List[str]]
    totalRows: int