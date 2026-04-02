import uuid
from .database import Base
from sqlalchemy import Column,String, Boolean, DateTime,Text,ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    username = Column(String, unique=True, index=True, nullable=False)
    id = Column(UUID(as_uuid=True) , primary_key=True, default=uuid.uuid4, index=True)
    email= Column(String , unique=True , index=True , nullable=False)
    
    hashed_password= Column(String , nullable=False)
    
    is_active= Column(Boolean , default=True)
    
    created_at= Column(DateTime(timezone=True) , server_default=func.now())
    
    journals = relationship("JournalEntry", back_populates="owner", cascade="all, delete-orphan")
    
class JournalEntry(Base):
    __tablename__ = "journals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Nullable for Guests
    title = Column(String(200), nullable=True)
    mood_tag = Column(String, default="Neutral")    
    content = Column(Text, nullable=False)
    is_saved = Column(Boolean, default=False) 
    mood_tag = Column(String, default="Neutral")
    trigger_category = Column(String, default="General")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="journals")
    memories = relationship("Memory", backref="source_journal", cascade="all, delete-orphan")

class Memory(Base):
    __tablename__ = "memories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    summary = Column(String(500), nullable=False) 
    source_journal_id = Column(UUID(as_uuid=True), ForeignKey("journals.id",ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())