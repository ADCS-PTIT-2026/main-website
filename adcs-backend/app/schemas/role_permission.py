from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID

# --- ROLE SCHEMAS ---
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    pass

class RoleResponse(RoleBase):
    role_id: UUID
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# --- PERMISSION SCHEMAS ---
class PermissionBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(PermissionBase):
    pass

class PermissionResponse(BaseModel):
    permission_id: UUID
    model_config = ConfigDict(from_attributes=True)

# --- MATRIX SCHEMAS ---
class MatrixUpdateResponse(BaseModel):
    message: str