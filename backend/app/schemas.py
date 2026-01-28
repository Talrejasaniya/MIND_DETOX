from pydantic import BaseModel,EmailStr,Field , ConfigDict
from datetime import datetime 
from uuid import UUID

class UserCreate(BaseModel):
    email: EmailStr
    password: str  = Field(..., min_length=8, max_length=72)

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    
class Userlogin(BaseModel):
    email: EmailStr
    password: str =  Field(..., min_length=8, max_length=72)
    
class TokenResponse(BaseModel):
    access_token: str
    token_type: str