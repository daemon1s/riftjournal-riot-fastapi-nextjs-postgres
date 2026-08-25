import contextlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import SessionLocal, engine
from app.models.entities import Base
from app.routers import auth, errors, matches, matchups
from app.services.db_service import DBService


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with SessionLocal() as db:
        await DBService.seed_initial_data(db)
        
    yield
    await engine.dispose()

app = FastAPI(
    title="Evelynn OTP Mental & Performance Analytics Suite",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matches.router)
app.include_router(matchups.router)
app.include_router(errors.router)
app.include_router(auth.router)
