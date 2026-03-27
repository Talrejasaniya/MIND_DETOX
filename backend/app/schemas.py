from pydantic import BaseModel,EmailStr,Field , ConfigDict
from datetime import datetime 
from uuid import UUID
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
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
    
# Base schema (Common fields)
class JournalBase(BaseModel):
   title: Optional[str] = Field(None, max_length=200, description="My First Brain Dump")
   content: str = Field(..., min_length=1, description="Today I felt a bit overwhelmed...")
   mood_tag: Optional[str] = Field(None, description="Neutral")
    
# Data coming from Frontend (User input)
class JournalCreate(JournalBase):
    pass

# Data going to Frontend (Response)
class JournalResponse(JournalBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    #updated_at: Optional[datetime]

    class Config:
        from_attributes = True # SQLAlchemy models ko Pydantic mein convert karne ke liye
        
# User jo dump bhejega
class AIMirrorRequest(BaseModel): 
   content: str = Field(..., min_length=1)
# AI jo reflection bhejega
class AIMirrorResponse(BaseModel):
    reflection: str
    
# Base Memory Model
class MemoryBase(BaseModel):
    summary: str # R4: Sirf summary save hogi

# Response Model (Jo user ko dikhega)
class MemoryResponse(MemoryBase):
    id: UUID
    user_id: UUID
    source_journal_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True # SQLAlchemy models ko Pydantic mein convert karne ke liye