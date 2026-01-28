from jose import JWTError, jwt
from fastapi import Depends, status, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .. import models, database, schemas
from ..config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Token decode karna (Ensure settings.secret_key and settings.algorithm are correct)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.algorithm])
        user_id: str = payload.get("user_id")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Database se user fetch karna
    user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user