from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.db_service import DBService
from app.services.riot_service import RiotService
from app.schemas.schemas import MatchCreate, MatchResponse, RiotMatchPreview, RecentMatchItem
from app.services.auth_service import get_current_admin
from typing import List, Optional
import asyncio
from datetime import datetime, timezone
import httpx

router = APIRouter(prefix="/v1/matches", tags=["matches"])
riot_service = RiotService()


@router.get("", response_model=List[MatchResponse])
async def list_matches(db: AsyncSession = Depends(get_db)):
    return await DBService.get_matches(db)

@router.get("/latest", response_model=RiotMatchPreview)
async def get_latest_match(
    puuid: Optional[str] = None,
    riot_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        user_puuid = puuid
        if not user_puuid and riot_id:
            if "#" not in riot_id:
                raise HTTPException(status_code=400, detail="Invalid Riot ID format. Use Name#TAG.")
            parts = riot_id.split("#", 1)
            user_puuid = await riot_service.get_puuid_by_riot_id(parts[0], parts[1])
        
        if not user_puuid:
            raise HTTPException(status_code=400, detail="Either puuid or riot_id must be provided")

        match_id = await riot_service.get_latest_match_id(user_puuid)
        
        history = await DBService.get_matches(db)
        for saved_match in history:
            if saved_match.match_id == match_id:
                raise HTTPException(
                    status_code=409, 
                    detail=f"Match {match_id} is already recorded in the tracker."
                )

        payload = await riot_service.get_match_details(match_id)
        timeline_payload = await riot_service.get_match_timeline(match_id)
        processed = riot_service.process_match_payload(payload, timeline_payload, user_puuid)
        
        user_rank_info = await riot_service.get_summoner_rank_by_puuid(user_puuid)
        rival_jg_puuid = processed.get("rival_jg_puuid")
        rival_rank_info = await riot_service.get_summoner_rank_by_puuid(rival_jg_puuid) if rival_jg_puuid else {"tier": "UNRANKED", "rank": "", "lp": 0}
        
        processed["user_tier"] = user_rank_info.get("tier")
        processed["user_rank"] = user_rank_info.get("rank")
        processed["user_lp"] = user_rank_info.get("lp")
        processed["rival_jg_tier"] = rival_rank_info.get("tier")
        processed["rival_jg_rank"] = rival_rank_info.get("rank")
        
        return RiotMatchPreview(**processed)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Riot API error: {e.response.text}")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recent", response_model=List[RecentMatchItem])
async def get_recent_matches(
    puuid: Optional[str] = None,
    riot_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        user_puuid = puuid
        if not user_puuid and riot_id:
            if "#" not in riot_id:
                raise HTTPException(status_code=400, detail="Invalid Riot ID format. Use Name#TAG.")
            parts = riot_id.split("#", 1)
            user_puuid = await riot_service.get_puuid_by_riot_id(parts[0], parts[1])
        
        if not user_puuid:
            raise HTTPException(status_code=400, detail="Either puuid or riot_id must be provided")

        # Get recent 10 match IDs
        match_ids = await riot_service.get_recent_match_ids(user_puuid, count=10)
        
        # Check which exist in database
        history = await DBService.get_matches(db)
        saved_ids = {m.match_id for m in history}
        
        unregistered_ids = [mid for mid in match_ids if mid not in saved_ids]
        
        async def get_recent_item(mid: str) -> RecentMatchItem:
            payload = await riot_service.get_match_details(mid)
            info = payload["info"]
            participants = info["participants"]
            user_data = next((p for p in participants if p["puuid"] == user_puuid), None)
            if not user_data:
                user_data = participants[0]
            
            # Formulate KDA
            kda = f"{user_data['kills']}/{user_data['deaths']}/{user_data['assists']}"
            
            return RecentMatchItem(
                match_id=mid,
                champion=user_data["championName"],
                kda=kda,
                outcome="W" if user_data["win"] else "L",
                played_at=datetime.fromtimestamp(info["gameStartTimestamp"] / 1000, tz=timezone.utc),
                game_duration=info["gameDuration"]
            )
        
        # Concurrently fetch basic details for unregistered matches
        recent_items = await asyncio.gather(*(get_recent_item(mid) for mid in unregistered_ids))
        return list(recent_items)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Riot API error: {e.response.text}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview/{match_id}", response_model=RiotMatchPreview)
async def get_match_preview(
    match_id: str,
    puuid: Optional[str] = None,
    riot_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    try:
        user_puuid = puuid
        if not user_puuid and riot_id:
            if "#" not in riot_id:
                raise HTTPException(status_code=400, detail="Invalid Riot ID format. Use Name#TAG.")
            parts = riot_id.split("#", 1)
            user_puuid = await riot_service.get_puuid_by_riot_id(parts[0], parts[1])
        
        if not user_puuid:
            raise HTTPException(status_code=400, detail="Either puuid or riot_id must be provided")

        history = await DBService.get_matches(db)
        for saved_match in history:
            if saved_match.match_id == match_id:
                raise HTTPException(
                    status_code=409, 
                    detail=f"Match {match_id} is already recorded in the tracker."
                )

        payload = await riot_service.get_match_details(match_id)
        timeline_payload = await riot_service.get_match_timeline(match_id)
        processed = riot_service.process_match_payload(payload, timeline_payload, user_puuid)
        
        user_rank_info = await riot_service.get_summoner_rank_by_puuid(user_puuid)
        rival_jg_puuid = processed.get("rival_jg_puuid")
        rival_rank_info = await riot_service.get_summoner_rank_by_puuid(rival_jg_puuid) if rival_jg_puuid else {"tier": "UNRANKED", "rank": "", "lp": 0}
        
        processed["user_tier"] = user_rank_info.get("tier")
        processed["user_rank"] = user_rank_info.get("rank")
        processed["user_lp"] = user_rank_info.get("lp")
        processed["rival_jg_tier"] = rival_rank_info.get("tier")
        processed["rival_jg_rank"] = rival_rank_info.get("rank")
        
        return RiotMatchPreview(**processed)
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Riot API error: {e.response.text}")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save", response_model=MatchResponse)
async def save_match(
    data: MatchCreate, 
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    try:
        history = await DBService.get_matches(db)
        for m in history:
            if m.match_id == data.match_id:
                raise HTTPException(status_code=400, detail="Match already saved")

        user_puuid = data.puuid
        timeline_payload = await riot_service.get_match_timeline(data.match_id)
        processed = riot_service.process_match_payload(data.riot_payload_raw, timeline_payload, user_puuid)
        
        if data.user_tier is not None or data.user_rank is not None or data.user_lp is not None:
            processed["user_tier"] = data.user_tier
            processed["user_rank"] = data.user_rank
            processed["user_lp"] = data.user_lp
        else:
            user_rank_info = await riot_service.get_summoner_rank_by_puuid(user_puuid)
            processed["user_tier"] = user_rank_info.get("tier")
            processed["user_rank"] = user_rank_info.get("rank")
            processed["user_lp"] = user_rank_info.get("lp")

        rival_jg_puuid = processed.get("rival_jg_puuid")
        rival_rank_info = await riot_service.get_summoner_rank_by_puuid(rival_jg_puuid) if rival_jg_puuid else {"tier": "UNRANKED", "rank": "", "lp": 0}
        processed["rival_jg_tier"] = rival_rank_info.get("tier")
        processed["rival_jg_rank"] = rival_rank_info.get("rank")
        
        match_obj = await DBService.save_match(
            db=db,
            match_data=data,
            processed=processed
        )
        return match_obj
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{match_id}")
async def delete_match(
    match_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(get_current_admin)
):
    success = await DBService.delete_match(db, match_id)
    if not success:
        raise HTTPException(status_code=404, detail="Match not found")
    return {"message": "Match deleted successfully"}
