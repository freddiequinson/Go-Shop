"""
GoShopGhana FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.middleware.audit_middleware import AuditLoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 GoShopGhana API starting up...")
    yield
    # Shutdown
    print("🛑 GoShopGhana API shutting down...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GoShopGhana - Social Commerce Platform for Ghana",
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Middleware to force HTTPS in redirects
class ForceHTTPSRedirectMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # If it's a redirect, ensure it uses HTTPS
        if response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get("location")
            if location and location.startswith("http://"):
                response.headers["location"] = location.replace("http://", "https://", 1)
        return response

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add HTTPS redirect middleware (must be before audit middleware)
app.add_middleware(ForceHTTPSRedirectMiddleware)

# Add audit logging middleware
app.add_middleware(AuditLoggingMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to GoShopGhana API",
        "version": settings.VERSION,
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "goshopghana-api"}


# API docs endpoints (only available in DEBUG mode)
if settings.DEBUG:
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui_html():
        """Custom Swagger UI redirect"""
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{settings.API_V1_STR}/docs")

    @app.get("/redoc", include_in_schema=False)
    async def redoc_html():
        """Custom ReDoc redirect"""
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{settings.API_V1_STR}/redoc")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
