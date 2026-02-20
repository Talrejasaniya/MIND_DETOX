from fastapi import APIRouter, Depends, HTTPException, status,Response
from google import genai
from .. import models,database,schemas,utils,config
from ..database import get_db
from . import oauth2
from uuid import UUID
from sqlalchemy.orm import Session
from typing import List
from ..config import settings
router = APIRouter(prefix="/ai", tags=['AI Mirror'])
print(f"DEBUG: Setting key is -> '{config.settings.GEMINI_API_KEY}'")
client = genai.Client(api_key=config.settings.GEMINI_API_KEY)

@router.post("/mirror", response_model=schemas.AIMirrorResponse)
def get_ai_reflection(request: schemas.AIMirrorRequest):
    try:        
        system_instruction = (
    "Respond in the same language style as the user input: English / Hindi / Hinglish. Do not convert Hinglish into pure Hindi."
    "You are an emotional mirror, not an advisor, therapist, or problem-solver."
    "Rules: Reflect emotions in simple, human language. Do NOT give advice, steps, or motivation."
    "Do NOT mention past conversations or memory. Keep response between 3–5 lines."
    "Use a non-judgmental tone. Never say 'you should' or 'try to'."
    "EMPATHY LAYERS: First, name the feeling in soft language (Emotional Empathy). "
    "Second, paraphrase the user's context (Cognitive Empathy)."
    "VARIETY: Avoid starting every response with 'Aapko...'. Use different sentence structures."
    "EXPLORATION: End with ONE short, open-ended question that asks the user to tell you more (e.g., 'Aapko is baare mein aur kya mehsoos ho raha hai?')."
    "Output ONLY the reflection and the question."
)
        
        full_prompt = f"{system_instruction}\n\nUser Input: {request.content}"
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=request.content,
            config={"system_instruction": system_instruction}
        )
        
        if not response.text:
            raise ValueError("AI returned empty response")
            
        return {"reflection": response.text.strip()}
        
    except Exception as e:
        print(f"AI Error: {e}") 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="The mirror is currently foggy. Please try again in a moment."
        )
    
@router.post("/save-memory", response_model=schemas.MemoryResponse)
def save_memory(journal_id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    journal = db.query(models.JournalEntry).filter(models.JournalEntry.id == journal_id).first()
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Journal entry not found or unauthorized"
        )
    
    try:
        summary_prompt =  ("Summarize the core meaning of this thought in 1 short, neutral sentence."
                        "Write the summary in English or Hinglish (Roman script only)."
                        "Do NOT use pure Hindi or Devanagari script."
                        "Do NOT reuse emotional words or emotional expressions from the journal."
                        "Avoid advice, diagnosis, or interpretation."
                        "Keep it close to the user's own perspective, not analytical language.")
        full_input = f"{summary_prompt}\n\nUser's Thought: {journal.content}"
        summary_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_input
        )
        summary_text = summary_response.text if summary_response.text else "Could not generate summary."
        new_memory = models.Memory(
        user_id=current_user.id,
        summary=summary_response.text.strip(),
        source_journal_id=journal_id
        )
        journal.is_saved = True # Update status
        db.add(new_memory)
        db.commit()
        db.refresh(new_memory)
        return new_memory
     
    except Exception as e:
        print(f"Memory Save Error: {e}")
        raise HTTPException(status_code=500, detail="Could not process memory summary.")
    
@router.get("/memories", response_model=List[schemas.MemoryResponse])
def get_user_memories(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    memories = db.query(models.Memory).filter(models.Memory.user_id == current_user.id).all()
    return memories