from datetime import datetime, timedelta
import os
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = os.getenv("SECRET_KEY", "chave_super_secreta_padrao")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configura onde o sistema deve procurar o token de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login-admin")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7) # Token dura 7 dias
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- A NOSSA NOVA FECHADURA ---
def get_current_user(token: str = Depends(oauth2_scheme)):
    """Lê o Token, verifica se é autêntico e devolve os dados do utilizador."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sessão expirada ou inválida. Por favor, faça login novamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Desencripta o token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        if role is None:
            raise credentials_exception
        return payload  # Devolve os dados (sub/id, role, etc)
    except JWTError:
        raise credentials_exception