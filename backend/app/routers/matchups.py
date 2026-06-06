from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.schemas.schemas import MatchupResponse, MatchupUpdate
from app.services.auth_service import get_current_admin

router = APIRouter(prefix="/v1/matchups", tags=["matchups"])

@router.get("/{champion_name}", response_model=MatchupResponse)
async def get_matchup(champion_name: str, db: AsyncSession = Depends(get_db)):
    matchup = await DBService.get_matchup_by_champion(db, champion_name)
    if not matchup:
        return MatchupResponse(id=0, champion_name=champion_name, counterplay="")
    return matchup

@router.put("/{champion_name}", response_model=MatchupResponse)
async def update_matchup(
    champion_name: str, 
    data: MatchupUpdate, 
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    return await DBService.update_or_create_matchup(db, champion_name, data.counterplay)
