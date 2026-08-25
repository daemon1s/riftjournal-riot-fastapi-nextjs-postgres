
from app.database.session import get_db
from app.schemas.schemas import ErrorCatalogResponse
from app.services.db_service import DBService
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/v1/errors", tags=["errors"])

@router.get("", response_model=list[ErrorCatalogResponse])
async def get_errors(db: AsyncSession = Depends(get_db)):  # noqa: B008
    return await DBService.get_all_errors(db)
