from pydantic import BaseModel,EmailStr,Field 
from datetime import datetime 
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    password: str  = Field(min_length=8)

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True