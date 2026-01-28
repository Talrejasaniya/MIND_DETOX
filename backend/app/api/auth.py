from fastapi import APIRouter,HTTPException,Depends,status
from sqlalchemy.orm import Session
from .. import models,database,schemas,utils
from sqlalchemy.exc import IntegrityError
from ..database import get_db
import logging
from jose import JWTError, jwt
# Apne config se SECRET_KEY aur ALGORITHM import karo
from ..config import settings 
from .oauth2 import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

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

@router.post("/login",status_code=status.HTTP_200_OK,response_model=schemas.TokenResponse)
async def login(db: Session = Depends(get_db), user_credentials: OAuth2PasswordRequestForm = Depends()):
    logger.info(f"Login attempt for email: {user_credentials.username}")
    user = db.query(models.User).filter(models.User.email == user_credentials.username).first()
    if not user or not utils.verify_password(user_credentials.password, user.hashed_password):
        logger.warning(f"Login failed for: {user_credentials.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid credentials"
        )
    

    access_token = utils.create_access_token(data={"user_id": str(user.id)})

    return schemas.TokenResponse(access_token=access_token, token_type="bearer")

@router.get("/users/me", response_model=schemas.UserResponse)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user