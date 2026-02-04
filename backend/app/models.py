import uuid
from .database import Base
from sqlalchemy import Column,String, Boolean, DateTime,Text,ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True) , primary_key=True, default=uuid.uuid4, index=True)
    
    email= Column(String , unique=True , index=True , nullable=False)
    
    hashed_password= Column(String , nullable=False)
    
    is_active= Column(Boolean , default=True)
    
    created_at= Column(DateTime(timezone=True) , server_default=func.now())
    
    journals = relationship("JournalEntry", back_populates="owner", cascade="all, delete-orphan")
    
class JournalEntry(Base):
    __tablename__ = "journals"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Foreign Key (Relationship with User)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Core Fields (Based on your research)
    title = Column(String(255), nullable=True) # Optional heading
    content = Column(Text, nullable=False)      # Main Brain Dump area
    
    # Analysis Fields
    category = Column(String(50), default="General") # Stress, Task, Reflection
    mood_tag = Column(String(50), nullable=True)    # For Visual Calendar
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Back Reference to User
    owner = relationship("User", back_populates="journals")