from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ErrorCatalogResponse(BaseModel):
    id: int
    error_text: str

    class Config:
        from_attributes = True

class MatchupResponse(BaseModel):
    id: int
    champion_name: str
    counterplay: str | None = None

    class Config:
        from_attributes = True

class MatchupUpdate(BaseModel):
    counterplay: str

class MatchCreate(BaseModel):
    match_id: str
    puuid: str
    tilt_fase_maxima: str | None = None
    trigger_categoria: str | None = None
    recuperacion_tilt: str | None = None
    match_notes: str | None = None
    error_texts: list[str]
    riot_payload_raw: dict[str, Any]
    user_tier: str | None = None
    user_rank: str | None = None
    user_lp: int | None = None

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
    user_tier: str | None = None
    user_rank: str | None = None
    user_lp: int | None = None
    rival_jg_tier: str | None = None
    rival_jg_rank: str | None = None
    tilt_fase_maxima: str | None = None
    trigger_categoria: str | None = None
    recuperacion_tilt: str | None = None
    pre_six_deaths: int
    gold_diff_10: int
    xp_diff_10: int
    full_clear_time: int | None = None
    role_quest_time: int | None = None
    is_hardcore: bool = False
    gold_timeline: dict[str, Any] | None = None
    match_notes: str | None = None
    errors: list[ErrorCatalogResponse]
    game_date: datetime | None = None
    first_blood_kill: bool = False
    gank_coords: list[dict[str, Any]] | None = None
    death_coords: list[dict[str, Any]] | None = None
    user_build: list[int] | None = None
    teams: dict[str, Any] | None = None

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
    user_tier: str | None = None
    user_rank: str | None = None
    user_lp: int | None = None
    rival_jg_tier: str | None = None
    rival_jg_rank: str | None = None
    pre_six_deaths: int
    gold_diff_10: int
    xp_diff_10: int
    full_clear_time: int | None = None
    role_quest_time: int | None = None
    is_hardcore: bool = False
    gold_timeline: dict[str, Any] | None = None
    riot_payload_raw: dict[str, Any]
    game_date: datetime | None = None
    first_blood_kill: bool = False
    gank_coords: list[dict[str, Any]] | None = None
    death_coords: list[dict[str, Any]] | None = None
    user_build: list[int] | None = None
    teams: dict[str, Any] | None = None


class RecentMatchItem(BaseModel):
    match_id: str
    champion: str
    kda: str
    outcome: str  # "W" or "L"
    played_at: datetime
    game_duration: int

