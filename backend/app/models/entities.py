from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, Table, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, relationship

class Base(DeclarativeBase):
    pass

match_errors = Table(
    "match_errors",
    Base.metadata,
    Column("match_id", Integer, ForeignKey("matches.id", ondelete="CASCADE"), primary_key=True),
    Column("error_id", Integer, ForeignKey("error_catalog.id", ondelete="CASCADE"), primary_key=True)
)

class ErrorCatalog(Base):
    __tablename__ = "error_catalog"

    id = Column(Integer, primary_key=True, autoincrement=True)
    error_text = Column(String, unique=True, nullable=False)

    matches = relationship("Match", secondary=match_errors, back_populates="errors")

class MatchupChampions(Base):
    __tablename__ = "matchup_champions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    champion_name = Column(String(50), unique=True, nullable=False)
    counterplay = Column(String, nullable=True)

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(String(50), unique=True, nullable=False)
    played_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    champion = Column(String(50), nullable=False)
    rival_jg = Column(String(50), nullable=False)
    outcome = Column(String(1), nullable=False)
    kda = Column(String(20), nullable=False)
    cs_min = Column(Numeric(4, 2), nullable=False)

    kill_participation = Column(Numeric(5, 2), nullable=False)
    damage_per_min = Column(Numeric(6, 2), nullable=False)
    gold_per_min = Column(Numeric(6, 2), nullable=False)
    control_wards = Column(Integer, nullable=False)
    vision_score = Column(Integer, nullable=False)
    time_spent_dead = Column(Integer, nullable=False)
    game_duration = Column(Integer, nullable=False)

    gold_diff_jg = Column(Integer, nullable=False)
    xp_diff_jg = Column(Integer, nullable=False)
    wards_placed = Column(Integer, nullable=False)
    wards_killed = Column(Integer, nullable=False)
    solo_kills = Column(Integer, nullable=False)
    enemy_jg_monsters = Column(Integer, nullable=False)
    gold_diff_most_fed_enemy = Column(Integer, nullable=False)
    largest_multikill = Column(Integer, nullable=False)
    level_6_minute = Column(Integer, nullable=False)
    user_tier = Column(String(20), nullable=True)
    user_rank = Column(String(10), nullable=True)
    user_lp = Column(Integer, nullable=True)
    rival_jg_tier = Column(String(20), nullable=True)
    rival_jg_rank = Column(String(10), nullable=True)

    tilt_fase_maxima = Column(String(50), nullable=True)
    trigger_categoria = Column(String(50), nullable=True)
    recuperacion_tilt = Column(String(50), nullable=True)

    pre_six_deaths = Column(Integer, default=0, nullable=False)
    gold_diff_10 = Column(Integer, default=0, nullable=False)
    xp_diff_10 = Column(Integer, default=0, nullable=False)
    full_clear_time = Column(Integer, nullable=True)
    role_quest_time = Column(Integer, nullable=True)

    is_hardcore = Column(Boolean, default=False, server_default="false", nullable=False)
    gold_timeline = Column(JSONB, nullable=True)

    match_notes = Column(String, nullable=True)
    riot_payload_raw = Column(JSONB, nullable=False)
    game_date = Column(DateTime(timezone=True), nullable=True)
    first_blood_kill = Column(Boolean, default=False, server_default="false", nullable=False)
    gank_coords = Column(JSONB, nullable=True)
    death_coords = Column(JSONB, nullable=True)

    errors = relationship("ErrorCatalog", secondary=match_errors, back_populates="matches")

    @property
    def user_build(self) -> list[int]:
        payload = self.riot_payload_raw
        if not payload:
            return [0] * 7
        participants = payload.get("info", {}).get("participants", [])
        for p in participants:
            if p.get("championName", "").lower() == self.champion.lower():
                return [p.get(f"item{i}", 0) for i in range(7)]
        return [0] * 7

    @property
    def teams(self) -> dict[str, list[dict]]:
        payload = self.riot_payload_raw
        if not payload:
            return {"allies": [], "enemies": []}
        participants = payload.get("info", {}).get("participants", [])
        user_team_id = None
        for p in participants:
            if p.get("championName", "").lower() == self.champion.lower():
                user_team_id = p.get("teamId")
                break
        
        allies = []
        enemies = []
        for p in participants:
            champ = p.get("championName", "")
            kills = p.get("kills", 0)
            deaths = p.get("deaths", 0)
            assists = p.get("assists", 0)
            kda_str = f"{kills}/{deaths}/{assists}"
            build = [p.get(f"item{i}", 0) for i in range(7)]
            gold = p.get("goldEarned", 0)
            damage = p.get("totalDamageDealtToChampions", 0)
            p_data = {
                "champion": champ,
                "kda": kda_str,
                "build": build,
                "gold": gold,
                "damage": damage
            }
            if p.get("teamId") == user_team_id:
                allies.append(p_data)
            else:
                enemies.append(p_data)
        return {"allies": allies, "enemies": enemies}

    __table_args__ = (
        CheckConstraint("outcome IN ('W', 'L')"),
    )

