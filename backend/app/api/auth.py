from fastapi import APIRouter,HTTPException,Depends,status
from sqlalchemy.orm import Session
from .. import models,database,schemas,utils
from sqlalchemy.exc import IntegrityError
from ..database import get_db
import logging

logging.basicConfig(level=logging.INFO,format='%(asctime)s - %(levelname)s - %(message)s')
logger=logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=schemas.UserResponse)
async def signup(User: schemas.UserCreate,db : Session=Depends(database.get_db)):
    logger.info(f"Attempting to register user with email: {User.email}")
    hashed_password = utils.hash_password(User.password)
    
    new_user= models.User(
        email=User.email,
        hashed_password=hashed_password
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"User registered successfully with email: {User.email}")
        return new_user
    except IntegrityError:
        db.rollback()
        logger.warning(f"Registration failed: Email already registered - {User.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
            )