import pytest
from datetime import timedelta
import jwt
from app.services.auth_service import verify_password, create_access_token
from app.config.settings import settings

def test_verify_password():
    password = "test_password"
    hashed = "14b03704ef1a029cf05c317a6c9cf1c2656360058b76c8c4e402b374da7c6d66"
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_create_access_token():
    payload = {"sub": "admin"}
    token = create_access_token(data=payload, expires_delta=timedelta(minutes=15))
    assert isinstance(token, str)
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert decoded["sub"] == "admin"
    assert "exp" in decoded
