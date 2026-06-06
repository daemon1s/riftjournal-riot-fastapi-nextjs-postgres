from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.schemas.schemas import ErrorCatalogResponse
from typing import List

router = APIRouter(prefix="/v1/errors", tags=["errors"])

@router.get("", response_model=List[ErrorCatalogResponse])
async def get_errors(db: AsyncSession = Depends(get_db)):
    return await DBService.get_all_errors(db)
