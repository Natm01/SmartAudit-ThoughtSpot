# backend/main.py - Configuración mejorada para desarrollo y producción
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from app.routers import users, projects, applications, import_router
import uvicorn
import os

# Variable de entorno para controlar el modo
DEVELOPMENT_MODE = os.environ.get("DEVELOPMENT_MODE", "false").lower() == "true"
SERVE_FRONTEND = os.environ.get("SERVE_FRONTEND", "true").lower() == "true"

app = FastAPI(
    title="SmartAudit API",
    description="API para el sistema SmartAudit de Grant Thornton",
    version="1.0.0"
)

# Middleware CORS - Más permisivo en desarrollo
if DEVELOPMENT_MODE:
    print("🔧 Running in DEVELOPMENT mode")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "*"  # Permitir todos los orígenes en desarrollo
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    print("🚀 Running in PRODUCTION mode")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://smartaudit-thoughtspot.onrender.com",
            # Agregar aquí otros dominios de producción
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

# Incluir routers de la API ANTES de las rutas estáticas
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])

# Endpoints de la API
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy", 
        "message": "SmartAudit API is running",
        "mode": "development" if DEVELOPMENT_MODE else "production",
        "serves_frontend": SERVE_FRONTEND
    }

@app.get("/api/")
def api_root():
    return {
        "message": "SmartAudit API",
        "version": "1.0.0",
        "status": "running",
        "mode": "development" if DEVELOPMENT_MODE else "production",
        "endpoints": {
            "health": "/api/health",
            "users": "/api/users",
            "users_all": "/api/users/all",
            "projects": "/api/projects",
            "applications": "/api/applications",
            "import": "/api/import"
        }
    }

# Solo servir frontend si está habilitado y no estamos en modo desarrollo separado
if SERVE_FRONTEND and not DEVELOPMENT_MODE:
    # Configurar la ruta a la carpeta build del frontend
    BUILD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/build"))
    STATIC_DIR = os.path.join(BUILD_DIR, "static")

    # Verificar que la carpeta build existe
    if os.path.exists(BUILD_DIR):
        print(f"✅ Frontend build directory found: {BUILD_DIR}")
        
        # Servir archivos estáticos (CSS, JS, imágenes)
        if os.path.exists(STATIC_DIR):
            app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
            print(f"✅ Static files mounted from: {STATIC_DIR}")
        
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

        # Catch-all route para servir el frontend React
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

    else:
        print(f"❌ Frontend build directory not found: {BUILD_DIR}")
        
        # Si no hay build, solo servir la API
        @app.get("/")
        async def root_no_build():
            return {
                "message": "SmartAudit API",
                "version": "1.0.0",
                "status": "running",
                "mode": "development" if DEVELOPMENT_MODE else "production",
                "note": "Frontend build not found. This is API-only mode.",
                "available_endpoints": [
                    "/api/health",
                    "/api/users/current",
                    "/api/users/all",
                    "/api/projects/current-user",
                    "/api/applications/current-user",
                    "/api/debug/routes"
                ]
            }

else:
    # Modo desarrollo - solo API
    print("🔧 Frontend serving disabled - API only mode")
    print("   To enable frontend serving, set SERVE_FRONTEND=true")
    print("   Frontend should be running separately on http://localhost:3000")
    
    @app.get("/")
    async def root_dev():
        return {
            "message": "SmartAudit API - Development Mode",
            "version": "1.0.0",
            "status": "running",
            "mode": "development",
            "note": "Frontend should be running separately on http://localhost:3000",
            "cors_enabled": True,
            "available_endpoints": [
                "/api/health",
                "/api/users/current",
                "/api/users/all",
                "/api/projects/current-user",
                "/api/applications/current-user",
                "/api/import/history"
            ]
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    
    # Configuración diferente para desarrollo vs producción
    if DEVELOPMENT_MODE:
        uvicorn.run(
            "main:app",  # Usar string para permitir reload
            host="0.0.0.0", 
            port=port, 
            reload=True,  # Auto-reload en desarrollo
            access_log=True,
            log_level="info"
        )
    else:
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port, 
            reload=False,  # Sin reload en producción
            access_log=True,
            log_level="warning"
        )