"""
Audit Logging Middleware
Automatically logs all API requests and responses
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.crud.audit_log import create_audit_log
from app.models.audit_log import AuditAction
import time
import json
import re
from typing import Callable
import traceback


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to automatically log all API requests
    """
    
    # Paths to exclude from logging (to avoid spam)
    EXCLUDED_PATHS = [
        "/docs",
        "/redoc",
        "/openapi.json",
        "/favicon.ico",
        "/static/",
    ]
    
    # Map HTTP methods and paths to audit actions
    ACTION_MAP = {
        # Auth
        ("POST", "/auth/login"): AuditAction.USER_LOGIN,
        ("POST", "/auth/register"): AuditAction.USER_REGISTER,
        
        # Users
        ("POST", "/users"): AuditAction.USER_CREATE,
        ("PUT", "/users"): AuditAction.USER_UPDATE,
        ("PATCH", "/users"): AuditAction.USER_UPDATE,
        ("DELETE", "/users"): AuditAction.USER_DELETE,
        
        # Products
        ("POST", "/products"): AuditAction.PRODUCT_CREATE,
        ("PUT", "/products"): AuditAction.PRODUCT_UPDATE,
        ("PATCH", "/products"): AuditAction.PRODUCT_UPDATE,
        ("DELETE", "/products"): AuditAction.PRODUCT_DELETE,
        ("POST", "/products/.*?/publish"): AuditAction.PRODUCT_PUBLISH,
        ("POST", "/products/.*?/unpublish"): AuditAction.PRODUCT_UNPUBLISH,
        
        # Orders
        ("POST", "/orders"): AuditAction.ORDER_CREATE,
        ("PUT", "/orders"): AuditAction.ORDER_UPDATE,
        
        # Payments
        ("POST", "/payments"): AuditAction.PAYMENT_INITIATE,
        
        # Suppliers
        ("POST", "/suppliers"): AuditAction.SUPPLIER_CREATE,
        ("PUT", "/suppliers"): AuditAction.SUPPLIER_UPDATE,
        ("PATCH", "/suppliers"): AuditAction.SUPPLIER_UPDATE,
        ("DELETE", "/suppliers"): AuditAction.SUPPLIER_DELETE,
        ("POST", "/suppliers/.*?/verify"): AuditAction.SUPPLIER_VERIFY,
        
        # Warehouse Inventory
        ("POST", "/warehouse/inventory"): AuditAction.WAREHOUSE_INVENTORY_CREATE,
        ("PUT", "/warehouse/inventory"): AuditAction.WAREHOUSE_INVENTORY_UPDATE,
        ("PATCH", "/warehouse/inventory"): AuditAction.WAREHOUSE_INVENTORY_UPDATE,
        ("POST", "/warehouse/movements"): AuditAction.WAREHOUSE_MOVEMENT_CREATE,
        ("POST", "/warehouse/adjust"): AuditAction.WAREHOUSE_STOCK_ADJUSTMENT,
        
        # GRN (Goods Received Notes)
        ("POST", "/warehouse/grn"): AuditAction.GRN_CREATE,
        ("PUT", "/warehouse/grn"): AuditAction.GRN_UPDATE,
        ("POST", "/warehouse/grn/.*?/approve"): AuditAction.GRN_APPROVE,
        ("POST", "/warehouse/grn/.*?/reject"): AuditAction.GRN_REJECT,
        
        # Pick Lists
        ("POST", "/warehouse/pick-lists"): AuditAction.PICK_LIST_CREATE,
        ("POST", "/warehouse/pick-lists/.*?/start"): AuditAction.PICK_LIST_START,
        ("POST", "/warehouse/pick-lists/.*?/complete"): AuditAction.PICK_LIST_COMPLETE,
        ("POST", "/warehouse/pick-lists/.*?/cancel"): AuditAction.PICK_LIST_CANCEL,
        
        # Wastage
        ("POST", "/warehouse/wastage"): AuditAction.WASTAGE_RECORD,
        
        # Locations
        ("POST", "/warehouse/locations"): AuditAction.LOCATION_CREATE,
        ("PUT", "/warehouse/locations"): AuditAction.LOCATION_UPDATE,
        ("PATCH", "/warehouse/locations"): AuditAction.LOCATION_UPDATE,
        ("DELETE", "/warehouse/locations"): AuditAction.LOCATION_DELETE,
    }
    
    def should_log(self, path: str) -> bool:
        """Check if this path should be logged"""
        for excluded in self.EXCLUDED_PATHS:
            if path.startswith(excluded):
                return False
        return True
    
    def get_action(self, method: str, path: str) -> AuditAction:
        """Determine the audit action based on method and path"""
        # Try pattern matching (supports regex)
        for (m, p), action in self.ACTION_MAP.items():
            if method == m:
                # Check if pattern contains regex characters
                if ".*?" in p or "(" in p or "[" in p:
                    # Use regex matching
                    if re.search(p, path):
                        return action
                else:
                    # Use simple substring matching
                    if p in path:
                        return action
        
        # Default actions based on method
        if method == "POST":
            return AuditAction.API_CALL
        elif method in ["PUT", "PATCH"]:
            return AuditAction.API_CALL
        elif method == "DELETE":
            return AuditAction.API_CALL
        else:
            return AuditAction.API_CALL
    
    def get_resource_info(self, path: str):
        """Extract resource type and ID from path"""
        parts = path.strip("/").split("/")
        
        # Remove 'api/v1' prefix if present
        if len(parts) > 2 and parts[0] == "api" and parts[1] == "v1":
            parts = parts[2:]
        
        resource_type = parts[0] if parts else None
        resource_id = None
        
        # Try to find UUID or ID in path
        for part in parts:
            if len(part) > 8 and ("-" in part or part.isalnum()):
                resource_id = part
                break
        
        return resource_type, resource_id
    
    def extract_user_info(self, request: Request):
        """Extract user information from request"""
        user_id = None
        user_email = None
        user_name = None
        
        # Try to get user from request state (set by auth middleware)
        if hasattr(request.state, "user"):
            user = request.state.user
            user_id = getattr(user, "id", None)
            user_email = getattr(user, "email", None)
            user_name = getattr(user, "full_name", None)
        
        return user_id, user_email, user_name
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and log it"""
        
        # Skip if path should not be logged
        if not self.should_log(request.url.path):
            return await call_next(request)
        
        start_time = time.time()
        db = SessionLocal()
        
        try:
            # Get request details
            method = request.method
            path = request.url.path
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent", "")
            
            # Extract user info
            user_id, user_email, user_name = self.extract_user_info(request)
            
            # Get resource info
            resource_type, resource_id = self.get_resource_info(path)
            
            # Determine action
            action = self.get_action(method, path)
            
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Determine status
            status = "success" if response.status_code < 400 else "failed"
            if response.status_code >= 500:
                status = "error"
            
            # Create description
            description = f"{method} {path}"
            if response.status_code >= 400:
                description += f" - Status {response.status_code}"
            
            # Prepare details
            details = {
                "method": method,
                "path": path,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "query_params": dict(request.query_params) if request.query_params else None,
            }
            
            # Log the request
            try:
                create_audit_log(
                    db=db,
                    action=action,
                    user_id=user_id,
                    user_email=user_email,
                    user_name=user_name,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    action_description=description,
                    details=details,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status=status,
                    error_message=None
                )
            except Exception as log_error:
                # Don't fail the request if logging fails
                print(f"Failed to create audit log: {log_error}")
            
            return response
            
        except Exception as e:
            # Log the error
            duration = time.time() - start_time
            
            try:
                user_id, user_email, user_name = self.extract_user_info(request)
                resource_type, resource_id = self.get_resource_info(request.url.path)
                
                create_audit_log(
                    db=db,
                    action=AuditAction.API_CALL,
                    user_id=user_id,
                    user_email=user_email,
                    user_name=user_name,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    action_description=f"{request.method} {request.url.path} - Exception",
                    details={
                        "method": request.method,
                        "path": request.url.path,
                        "duration_ms": round(duration * 1000, 2),
                        "exception": str(e),
                        "traceback": traceback.format_exc()
                    },
                    ip_address=request.client.host if request.client else None,
                    user_agent=request.headers.get("user-agent", ""),
                    status="error",
                    error_message=str(e)
                )
            except Exception as log_error:
                print(f"Failed to log exception: {log_error}")
            
            # Re-raise the original exception
            raise e
            
        finally:
            db.close()
