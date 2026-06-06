from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    RIOT_API_KEY: str
    RIOT_REGION: str = "americas"
    RIOT_PLATFORM: str = "la1"
    JWT_SECRET: str = "dev_secret_key_very_secret_evelynn_otp_1337"
    ADMIN_PASSWORD_HASH: str = "8a30a9c4fdf12f56006dfb3444351a64f735a24abe33011e3870d5f27a00cb27" # SHA-256 hash of 'evelynn'

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
