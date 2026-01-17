from fastapi import APIRouter,HTTPException,Depends,status
from sqlalchemy.orm import Session
from .. import models,database,schemas,utils
from sqlalchemy.exc import IntegrityError
from ..database import get_db

router = APIRouter(tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse)
def signup(User: schemas.UserCreate,db : Session=Depends(database.get_db)):
    hashed_password = utils.hash_password(User.password)
    
    new_user= models.User(
        email=User.email,
        hashed_password=hashed_password
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registeres"
            )