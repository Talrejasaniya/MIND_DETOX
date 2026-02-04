from fastapi import APIRouter, Depends, HTTPException, status,Response
from sqlalchemy.orm import Session
from .. import models, schemas, database
from . import oauth2
from typing import List
from uuid import UUID

router = APIRouter(
    prefix="/journals",
    tags=['Journals']
)

@router.post("/", status_code=status.HTTP_201_CREATED, response_model=schemas.JournalResponse)
def create_journal(
    journal: schemas.JournalCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(oauth2.get_current_user) # Security Layer
):
    # 1. New Journal Entry create karo
    # **current_user.id** humare token se aata hai, user ko ise bhejne ki zaroorat nahi hai
    new_journal = models.JournalEntry(user_id=current_user.id, **journal.model_dump())

    # 2. Database mein save karo
    db.add(new_journal)
    db.commit()
    
    # 3. Refresh taaki hume generated ID aur timestamp mil sake
    db.refresh(new_journal)

    return new_journal

@router.get("/", response_model=List[schemas.JournalResponse])
def get_user_journals(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    # 1. Database se journals fetch karo
    # 2. CRITICAL: Filter lagao user_id par taaki privacy bani rahe
    journals = db.query(models.JournalEntry).filter(
        models.JournalEntry.user_id == current_user.id
    ).order_by(models.JournalEntry.created_at.desc()).all()

    # 3. Agar koi journal nahi hai, toh empty list [] jayegi (which is fine)
    return journals

@router.put("/{id}", response_model=schemas.JournalResponse)
def update_journal(id: UUID, updated_entry: schemas.JournalCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    journal_query = db.query(models.JournalEntry).filter(models.JournalEntry.id == id)
    journal = journal_query.first()

    if not journal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    
    # Ownership Check: Kya ye journal isi user ka hai?
    if journal.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this journal")

    journal_query.update(updated_entry.model_dump(), synchronize_session=False)
    db.commit()
    return journal_query.first()

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal(id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    journal_query = db.query(models.JournalEntry).filter(models.JournalEntry.id == id)
    journal = journal_query.first()

    if not journal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")

    # Ownership Check
    if journal.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this journal")

    journal_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)