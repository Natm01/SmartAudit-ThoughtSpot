# backend/main.py - Actualizar para servir la carpeta build del frontend
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.routers import users, projects, applications, import_router
import uvicorn
import os

app = FastAPI(
    title="SmartAudit API",
    description="API para el sistema SmartAudit de Grant Thornton",
    version="1.0.0"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8001", "http://127.0.0.1:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers de la API
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])

# Configurar la ruta a la carpeta build del frontend
BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/build"))
STATIC_DIR = os.path.join(BUILD_DIR, "static")

# Verificar que la carpeta build existe
if os.path.exists(BUILD_DIR):
    # Servir archivos estáticos (CSS, JS, imágenes)
    if os.path.exists(STATIC_DIR):
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    
    # Servir otros archivos estáticos del build (manifest, favicon, etc.)
    @app.get("/favicon.ico")
    async def favicon():
        favicon_path = os.path.join(BUILD_DIR, "favicon.ico")
        if os.path.exists(favicon_path):
            return FileResponse(favicon_path)
        raise HTTPException(status_code=404, detail="Favicon not found")
    
    @app.get("/manifest.json")
    async def manifest():
        manifest_path = os.path.join(BUILD_DIR, "manifest.json")
        if os.path.exists(manifest_path):
            return FileResponse(manifest_path)
        raise HTTPException(status_code=404, detail="Manifest not found")
    
    @app.get("/robots.txt")
    async def robots():
        robots_path = os.path.join(BUILD_DIR, "robots.txt")
        if os.path.exists(robots_path):
            return FileResponse(robots_path)
        raise HTTPException(status_code=404, detail="Robots.txt not found")

# Endpoints de la API
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/")
def api_root():
    return {
        "message": "SmartAudit API",
        "version": "1.0.0",
        "status": "running"
    }

# Catch-all route para servir el frontend React
# Esto debe ir al final para no interceptar las rutas de la API
if os.path.exists(BUILD_DIR):
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        """
        Serve the React app for all non-API routes
        """
        # Si es una ruta de API, no debería llegar aquí
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Intentar servir el archivo solicitado
        file_path = os.path.join(BUILD_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Si no existe el archivo, servir index.html para que React Router maneje la ruta
        index_path = os.path.join(BUILD_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        
        raise HTTPException(status_code=404, detail="Frontend not found")

# Ruta raíz - servir el frontend
@app.get("/")
async def root():
    """
    Serve the main React app
    """
    if os.path.exists(BUILD_DIR):
        index_path = os.path.join(BUILD_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
    
    # Si no hay build, mostrar info de la API
    return {
        "message": "SmartAudit API",
        "version": "1.0.0",
        "status": "running",
        "note": "Frontend build not found. Run 'npm run build' in the frontend directory."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)