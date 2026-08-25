from app.config.settings import settings
from app.services.auth_service import (
    create_access_token,
    get_current_admin,
    verify_password,
)
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/v1/auth", tags=["auth"])

class LoginRequest(BaseModel):
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    if not verify_password(data.password, settings.ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": "admin"})
    return TokenResponse(access_token=access_token, token_type="bearer")

@router.get("/verify")
async def verify(username: str = Depends(get_current_admin)):
    return {"status": "ok", "role": "admin"}
