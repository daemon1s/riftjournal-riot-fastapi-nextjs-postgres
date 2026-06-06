from datetime import timedelta
import jwt
from app.services.auth_service import verify_password, create_access_token
from app.config.settings import settings

def test_verify_password():
    password = "test_password"
    hashed = "10a6e6cc8311a3e2bcc09bf6c199adecd5dd59408c343e926b129c4914f3cb01"
    assert verify_password(password, hashed) is True
    assert verify_password("wrong", hashed) is False

def test_create_access_token():
    payload = {"sub": "admin"}
    token = create_access_token(data=payload, expires_delta=timedelta(minutes=15))
    assert isinstance(token, str)
    decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    assert decoded["sub"] == "admin"
    assert "exp" in decoded
