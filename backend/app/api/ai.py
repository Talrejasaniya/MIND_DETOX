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
client = genai.Client(api_key=config.settings.GEMINI_API_KEY)

@router.post("/mirror", response_model=schemas.AIMirrorResponse)
def get_ai_reflection(request: schemas.AIMirrorRequest):
    try:        
        system_instruction=(
    """ROLE
You are an Emotional Mirror inside a mental wellness app called "Mind Detox". Your role is to listen and gently reflect the emotions a user shares so they feel understood and less alone in their experience.
Avoid repetitive reflection patterns such as 
"aisa lag raha hai", "sun kar lagta hai", or 
"it sounds like".

Vary sentence openings naturally the way humans speak.
PURPOSE
Users come here to pause and express what they are feeling. They are not looking for advice, solutions, or analysis. Your reflections simply acknowledge their emotions and create a calm space for them to continue expressing themselves.

BEHAVIOR
• Focus on the emotion behind the message rather than repeating the situation.
• Reflect feelings in a natural, human way.
• Keep responses short and clear.
• Match the user's emotional tone (calm, heavy, confused, energetic, etc.).
• Speak like a thoughtful person who is listening carefully.

TONE
Warm, steady, and conversational.
Avoid sounding clinical, dramatic, poetic, or overly enthusiastic.

LIMITS
• Do not give advice, suggestions, or solutions.
• Do not analyze, diagnose, or interpret the user's psychology.
• Do not challenge, correct, or reframe their emotions.
• Do not ask multiple questions or interrogate the user.

EDGE CASES
If a user asks for advice, gently remind them that your role is to listen and reflect rather than guide.
If a message expresses intense pain or distress, acknowledge the weight of the emotion without minimizing it.

RESPONSE STYLE
Write 1–3 short sentences reflecting the emotion the user may be experiencing.
You may optionally end with one gentle open-ended question that invites them to share more.

FORMAT
Write naturally in plain conversational text.
Do not use lists, formatting, or structured responses.

LANGUAGE
If the user writes in Hinglish, respond in Hinglish using Roman script.
If the user writes in English, respond fully in English.
Never use Devanagari script.
"""
)      
        full_prompt = f"{system_instruction}\n\nUser Input: {request.content}"
        
        response = client.models.generate_content(
    model="gemini-2.5-flash", # Correct model name
    contents=request.content,
    config={
        "system_instruction": system_instruction # Instruction pass karein
    }
)
        
        if not response.text:
            raise ValueError("AI returned empty response")
            
        return {"reflection": response.text.strip()}
        
    except Exception as e:
    # Print the full error to your terminal
       import traceback
       print(traceback.format_exc()) 
       raise HTTPException(status_code=500, detail=str(e))
@router.post("/save-memory", response_model=schemas.MemoryResponse)
def save_memory(journal_id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    journal = db.query(models.JournalEntry).filter(
        models.JournalEntry.id == journal_id,
        models.JournalEntry.user_id == current_user.id # CRITICAL SECURITY
    ).first()
    
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Journal entry not found or unauthorized"
        )
    
    try:
        summary_prompt =  ("""Write down the main point of this thought in exactly one short sentence.
• Perspective: Write it from a neutral, grounded perspective (e.g., 'Facing pressure about career' instead of 'The user is feeling stressed').
• No Emotional Re-triggering: Do not use heavy emotional adjectives. Keep it factual but close to the user's intent.
• Language: Use English or Hinglish (Roman script). No Devanagari.
• Human Tone: Avoid phrases like 'The core meaning is...' or 'This thought is about...' Just state the fact.""")
        full_input = f"{summary_prompt}\n\nUser's Thought: {journal.content}"
        summary_response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=full_input
        )
        summary_text = summary_response.text if summary_response.text else "Could not generate summary."
        new_memory = models.Memory(
        user_id=current_user.id,
        summary=summary_text.strip(),
        source_journal_id=journal_id
        )
        db.add(new_memory)
        db.query(models.JournalEntry).filter(models.JournalEntry.id == journal_id).update({"is_saved": True})
        db.commit()
        db.refresh(new_memory)
        return new_memory
     
    except Exception as e:
        print(f"Memory Save Error: {e}")
        raise HTTPException(status_code=500, detail="Could not process memory summary.")
    
@router.get("/all-memories", response_model=List[schemas.MemoryResponse])
def get_user_memories(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(oauth2.get_current_user)
):
    memories = db.query(models.Memory).filter(models.Memory.user_id == current_user.id).all()
    return memories

# app/api/ai.py ke end mein add karein

@router.delete("/memories/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(oauth2.get_current_user)):
    # 1. Database query
    memory_query = db.query(models.Memory).filter(models.Memory.id == id)
    memory = memory_query.first()

    # 2. Check existence
    if not memory:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory summary not found")

    # 3. CRITICAL SECURITY: Ownership Check (Aapki internship interview mein pucha ja sakta hai)
    if str(memory.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this memory")

    # 4. Perform Delete
    memory_query.delete(synchronize_session=False)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT) # No Content successful response