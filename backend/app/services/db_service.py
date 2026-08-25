from typing import Any

from app.models.entities import ErrorCatalog, Match, MatchupChampions
from app.schemas.schemas import MatchCreate
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload


class DBService:
    @staticmethod
    async def get_all_errors(db: AsyncSession) -> list[ErrorCatalog]:
        result = await db.execute(select(ErrorCatalog).order_by(ErrorCatalog.error_text))
        return list(result.scalars().all())

    @staticmethod
    async def get_matchup_by_champion(db: AsyncSession, champion_name: str) -> MatchupChampions | None:
        stmt = select(MatchupChampions).where(MatchupChampions.champion_name.ilike(champion_name))
        result = await db.execute(stmt)
        return result.scalars().first()

    @staticmethod
    async def update_or_create_matchup(db: AsyncSession, champion_name: str, counterplay: str) -> MatchupChampions:
        matchup = await DBService.get_matchup_by_champion(db, champion_name)
        if matchup:
            matchup.counterplay = counterplay
        else:
            matchup = MatchupChampions(champion_name=champion_name, counterplay=counterplay)
            db.add(matchup)
        await db.commit()
        await db.refresh(matchup)
        return matchup

    @staticmethod
    async def save_match(db: AsyncSession, match_data: MatchCreate, processed: dict[str, Any]) -> Match:
        error_objects = []
        for text in match_data.error_texts:
            text_cleaned = text.strip()
            if not text_cleaned:
                continue
            
            stmt = pg_insert(ErrorCatalog).values(error_text=text_cleaned)
            stmt = stmt.on_conflict_do_update(
                index_elements=[ErrorCatalog.error_text],
                set_={ErrorCatalog.error_text: text_cleaned}
            )
            await db.execute(stmt)
            
            sel_stmt = select(ErrorCatalog).where(ErrorCatalog.error_text == text_cleaned)
            res = await db.execute(sel_stmt)
            err_obj = res.scalars().first()
            if err_obj:
                error_objects.append(err_obj)

        match = Match(
            match_id=match_data.match_id,
            champion=processed["champion"],
            rival_jg=processed["rival_jg"],
            outcome=processed["outcome"],
            kda=processed["kda"],
            cs_min=processed["cs_min"],
            kill_participation=processed["kill_participation"],
            damage_per_min=processed["damage_per_min"],
            gold_per_min=processed["gold_per_min"],
            control_wards=processed["control_wards"],
            vision_score=processed["vision_score"],
            time_spent_dead=processed["time_spent_dead"],
            game_duration=processed["game_duration"],
            gold_diff_jg=processed["gold_diff_jg"],
            xp_diff_jg=processed["xp_diff_jg"],
            wards_placed=processed["wards_placed"],
            wards_killed=processed["wards_killed"],
            solo_kills=processed["solo_kills"],
            enemy_jg_monsters=processed["enemy_jg_monsters"],
            gold_diff_most_fed_enemy=processed["gold_diff_most_fed_enemy"],
            largest_multikill=processed["largest_multikill"],
            level_6_minute=processed["level_6_minute"],
            user_tier=processed.get("user_tier"),
            user_rank=processed.get("user_rank"),
            user_lp=processed.get("user_lp"),
            rival_jg_tier=processed.get("rival_jg_tier"),
            rival_jg_rank=processed.get("rival_jg_rank"),
            tilt_fase_maxima=match_data.tilt_fase_maxima,
            trigger_categoria=match_data.trigger_categoria,
            recuperacion_tilt=match_data.recuperacion_tilt,
            pre_six_deaths=processed["pre_six_deaths"],
            gold_diff_10=processed["gold_diff_10"],
            xp_diff_10=processed["xp_diff_10"],
            full_clear_time=processed.get("full_clear_time"),
            role_quest_time=processed.get("role_quest_time"),
            is_hardcore=processed.get("is_hardcore", False),
            gold_timeline=processed.get("gold_timeline"),
            match_notes=match_data.match_notes,
            riot_payload_raw=match_data.riot_payload_raw,
            game_date=processed.get("game_date"),
            first_blood_kill=processed.get("first_blood_kill", False),
            gank_coords=processed.get("gank_coords"),
            death_coords=processed.get("death_coords"),
            errors=error_objects
        )
        db.add(match)
        
        rival_jg = processed["rival_jg"]
        matchup = await DBService.get_matchup_by_champion(db, rival_jg)
        if not matchup:
            new_matchup = MatchupChampions(champion_name=rival_jg, counterplay="")
            db.add(new_matchup)

        await db.commit()
        
        stmt = select(Match).options(selectinload(Match.errors)).where(Match.id == match.id)
        res = await db.execute(stmt)
        return res.scalars().first()

    @staticmethod
    async def get_matches(db: AsyncSession) -> list[Match]:
        stmt = select(Match).options(selectinload(Match.errors)).order_by(Match.game_date.desc(), Match.played_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def delete_match(db: AsyncSession, match_id: str) -> bool:
        stmt = select(Match).where(Match.match_id == match_id)
        res = await db.execute(stmt)
        match_obj = res.scalars().first()
        if match_obj:
            await db.delete(match_obj)
            await db.commit()
            return True
        return False

    @staticmethod
    async def seed_initial_data(db: AsyncSession):
        errors_seed = [
            "hacer campamentos sin saber donde estÃ¡ mid rival.",
            "gankear gente con ghost",
            "entrar sin ulti",
            "gankear weakside",
            "jugar muy de libro (afk farm)",
            "comerse todo el cc en la teamfight",
            "morir con ulti"
        ]
        for err_text in errors_seed:
            stmt = pg_insert(ErrorCatalog).values(error_text=err_text).on_conflict_do_nothing()
            await db.execute(stmt)

        matchups_seed = {
            "Rengar": "Rengar: Permaban",
            "Viego": "Viego: No combear si hay un aliado low HP",
            "Lee Sin": "Lee Sin: Evitar peleas en nivel 3 si tiene doble buff",
            "Graves": "Graves: Cuidado con la invasiÃ³n en el segundo buff"
        }
        for champ, counter in matchups_seed.items():
            stmt = pg_insert(MatchupChampions).values(champion_name=champ, counterplay=counter).on_conflict_do_nothing()
            await db.execute(stmt)
            
        await db.commit()

        # Backfill existing matches: game_date and first_blood_kill
        stmt = select(Match)
        res = await db.execute(stmt)
        all_matches = res.scalars().all()
        updated_any = False
        for m in all_matches:
            if m.game_date is None or m.first_blood_kill is None:
                try:
                    payload = m.riot_payload_raw
                    info = payload.get("info", {})
                    
                    # 1. game_date
                    game_creation_ms = info.get("gameStartTimestamp") or info.get("gameCreation") or 0
                    if game_creation_ms:
                        from datetime import datetime, timezone
                        m.game_date = datetime.fromtimestamp(game_creation_ms / 1000, tz=timezone.utc)
                    
                    # 2. first_blood_kill
                    participants = info.get("participants", [])
                    user_data = None
                    for p in participants:
                        if p.get("championName", "").lower() == m.champion.lower():
                            user_data = p
                            break
                    if not user_data and participants:
                        user_data = participants[0]
                    
                    if user_data:
                        m.first_blood_kill = user_data.get("firstBloodKill", False)
                    
                    updated_any = True
                except Exception as e:  # noqa: BLE001
                    print(f"Error backfilling match {m.match_id}: {e}")
        if updated_any:
            await db.commit()
