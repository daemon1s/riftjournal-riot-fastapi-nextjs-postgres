from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ErrorCatalogResponse(BaseModel):
    id: int
    error_text: str

    class Config:
        from_attributes = True

class MatchupResponse(BaseModel):
    id: int
    champion_name: str
    counterplay: Optional[str] = None

    class Config:
        from_attributes = True

class MatchupUpdate(BaseModel):
    counterplay: str

class MatchCreate(BaseModel):
    match_id: str
    puuid: str
    tilt_fase_maxima: Optional[str] = None
    trigger_categoria: Optional[str] = None
    recuperacion_tilt: Optional[str] = None
    match_notes: Optional[str] = None
    error_texts: List[str]
    riot_payload_raw: Dict[str, Any]
    user_tier: Optional[str] = None
    user_rank: Optional[str] = None
    user_lp: Optional[int] = None

class MatchResponse(BaseModel):
    id: int
    match_id: str
    played_at: datetime
    champion: str
    rival_jg: str
    outcome: str
    kda: str
    cs_min: float
    kill_participation: float
    damage_per_min: float
    gold_per_min: float
    control_wards: int
    vision_score: int
    time_spent_dead: int
    game_duration: int
    gold_diff_jg: int
    xp_diff_jg: int
    wards_placed: int
    wards_killed: int
    solo_kills: int
    enemy_jg_monsters: int
    gold_diff_most_fed_enemy: int
    largest_multikill: int
    level_6_minute: int
    user_tier: Optional[str] = None
    user_rank: Optional[str] = None
    user_lp: Optional[int] = None
    rival_jg_tier: Optional[str] = None
    rival_jg_rank: Optional[str] = None
    tilt_fase_maxima: Optional[str] = None
    trigger_categoria: Optional[str] = None
    recuperacion_tilt: Optional[str] = None
    pre_six_deaths: int
    gold_diff_10: int
    xp_diff_10: int
    full_clear_time: Optional[int] = None
    role_quest_time: Optional[int] = None
    is_hardcore: bool = False
    gold_timeline: Optional[Dict[str, Any]] = None
    match_notes: Optional[str] = None
    errors: List[ErrorCatalogResponse]
    game_date: Optional[datetime] = None
    first_blood_kill: bool = False
    gank_coords: Optional[List[Dict[str, Any]]] = None
    death_coords: Optional[List[Dict[str, Any]]] = None
    user_build: Optional[List[int]] = None
    teams: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class RiotMatchPreview(BaseModel):
    match_id: str
    puuid: str
    champion: str
    rival_jg: str
    outcome: str
    kda: str
    cs_min: float
    kill_participation: float
    damage_per_min: float
    gold_per_min: float
    control_wards: int
    vision_score: int
    time_spent_dead: int
    game_duration: int
    gold_diff_jg: int
    xp_diff_jg: int
    wards_placed: int
    wards_killed: int
    solo_kills: int
    enemy_jg_monsters: int
    gold_diff_most_fed_enemy: int
    largest_multikill: int
    level_6_minute: int
    user_tier: Optional[str] = None
    user_rank: Optional[str] = None
    user_lp: Optional[int] = None
    rival_jg_tier: Optional[str] = None
    rival_jg_rank: Optional[str] = None
    pre_six_deaths: int
    gold_diff_10: int
    xp_diff_10: int
    full_clear_time: Optional[int] = None
    role_quest_time: Optional[int] = None
    is_hardcore: bool = False
    gold_timeline: Optional[Dict[str, Any]] = None
    riot_payload_raw: Dict[str, Any]
    game_date: Optional[datetime] = None
    first_blood_kill: bool = False
    gank_coords: Optional[List[Dict[str, Any]]] = None
    death_coords: Optional[List[Dict[str, Any]]] = None
    user_build: Optional[List[int]] = None
    teams: Optional[Dict[str, Any]] = None


class RecentMatchItem(BaseModel):
    match_id: str
    champion: str
    kda: str
    outcome: str  # "W" or "L"
    played_at: datetime
    game_duration: int

