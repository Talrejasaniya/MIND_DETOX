from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database
from .oauth2 import get_current_user

router = APIRouter()

@router.get("/summary")
async def get_mood_analytics(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 1. Triggers (Why) - Handling None as 'General'
    trigger_stats = db.query(
        models.JournalEntry.trigger_category, 
        func.count(models.JournalEntry.id)
    ).filter(models.JournalEntry.user_id == current_user.id)\
     .group_by(models.JournalEntry.trigger_category).all()

    # 2. Moods (How)
    mood_stats = db.query(
        models.JournalEntry.mood_tag, 
        func.count(models.JournalEntry.id)
    ).filter(models.JournalEntry.user_id == current_user.id)\
     .group_by(models.JournalEntry.mood_tag).all()

    return {
        "triggers": {(t or "General"): c for t, c in trigger_stats},
        "moods": {m: c for m, c in mood_stats}
    }