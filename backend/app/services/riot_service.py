import httpx
import urllib.parse
from datetime import datetime, timezone
from typing import Dict, Any
from app.config.settings import settings

class RiotService:
    def __init__(self):
        self.api_key = settings.RIOT_API_KEY
        self.region = settings.RIOT_REGION
        self.headers = {"X-Riot-Token": self.api_key}

    async def get_puuid_by_riot_id(self, game_name: str, tag_line: str) -> str:
        encoded_name = urllib.parse.quote(game_name.strip())
        encoded_tag = urllib.parse.quote(tag_line.strip())
        url = f"https://{self.region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{encoded_name}/{encoded_tag}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            return data["puuid"]

    async def get_latest_match_id(self, puuid: str) -> str:
        encoded_puuid = urllib.parse.quote(puuid.strip())
        url = f"https://{self.region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{encoded_puuid}/ids"
        params = {"start": 0, "count": 1, "queue": 420}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            match_ids = response.json()
            if not match_ids:
                params.pop("queue", None)
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                match_ids = response.json()
            if not match_ids:
                raise ValueError("No matches found")
            return match_ids[0]

    async def get_recent_match_ids(self, puuid: str, count: int = 10) -> list[str]:
        encoded_puuid = urllib.parse.quote(puuid.strip())
        url = f"https://{self.region}.api.riotgames.com/lol/match/v5/matches/by-puuid/{encoded_puuid}/ids"
        params = {"start": 0, "count": count, "queue": 420}
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            match_ids = response.json()
            if not match_ids:
                params.pop("queue", None)
                response = await client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                match_ids = response.json()
            return match_ids or []

    async def get_match_details(self, match_id: str) -> Dict[str, Any]:
        encoded_match_id = urllib.parse.quote(match_id.strip())
        url = f"https://{self.region}.api.riotgames.com/lol/match/v5/matches/{encoded_match_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def get_match_timeline(self, match_id: str) -> Dict[str, Any]:
        encoded_match_id = urllib.parse.quote(match_id.strip())
        url = f"https://{self.region}.api.riotgames.com/lol/match/v5/matches/{encoded_match_id}/timeline"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def get_summoner_rank_by_puuid(self, puuid: str) -> Dict[str, Any]:
        encoded_puuid = urllib.parse.quote(puuid.strip())
        url = f"https://{settings.RIOT_PLATFORM}.api.riotgames.com/lol/league/v4/entries/by-puuid/{encoded_puuid}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            entries = response.json()
            for entry in entries:
                if entry.get("queueType") == "RANKED_SOLO_5x5":
                    return {
                        "tier": entry.get("tier", "UNRANKED"),
                        "rank": entry.get("rank", ""),
                        "lp": entry.get("leaguePoints", 0)
                    }
            for entry in entries:
                if entry.get("queueType") == "RANKED_FLEX_SR":
                    return {
                        "tier": entry.get("tier", "UNRANKED"),
                        "rank": entry.get("rank", ""),
                        "lp": entry.get("leaguePoints", 0)
                    }
            return {"tier": "UNRANKED", "rank": "", "lp": 0}

    def process_match_payload(self, payload: Dict[str, Any], timeline_payload: Dict[str, Any], user_puuid: str) -> Dict[str, Any]:
        info = payload["info"]
        participants = info["participants"]
        
        user_data = None
        for p in participants:
            if p["puuid"] == user_puuid:
                user_data = p
                break
                
        if not user_data:
            for p in participants:
                if p.get("riotIdGameName") and p.get("riotIdTagline"):
                    user_data = p
                    break
            if not user_data:
                user_data = participants[0]

        team_id = user_data["teamId"]
        champion = user_data["championName"]
        outcome = "W" if user_data["win"] else "L"
        kda = f"{user_data['kills']}/{user_data['deaths']}/{user_data['assists']}"
        
        game_duration = info["gameDuration"]
        duration_min = game_duration / 60.0
        total_cs = user_data["totalMinionsKilled"] + user_data["neutralMinionsKilled"]
        cs_min = round(total_cs / duration_min, 2) if duration_min > 0 else 0.0

        total_team_kills = sum(p["kills"] for p in participants if p["teamId"] == team_id)
        if total_team_kills > 0:
            kill_participation = round(((user_data["kills"] + user_data["assists"]) / total_team_kills) * 100, 2)
        else:
            kill_participation = 0.0

        damage_per_min = round(user_data["totalDamageDealtToChampions"] / duration_min, 2) if duration_min > 0 else 0.0
        gold_per_min = round(user_data["goldEarned"] / duration_min, 2) if duration_min > 0 else 0.0
        control_wards = user_data["visionWardsBoughtInGame"]
        vision_score = user_data["visionScore"]
        time_spent_dead = user_data["totalTimeSpentDead"]

        opponents = [p for p in participants if p["teamId"] != team_id]
        
        rival_jg_data = None
        jg_candidates = []
        for opp in opponents:
            s1 = opp.get("summoner1Id")
            s2 = opp.get("summoner2Id")
            if s1 == 11 or s2 == 11:
                jg_candidates.append(opp)

        if len(jg_candidates) == 1:
            rival_jg_data = jg_candidates[0]
        elif len(jg_candidates) > 1:
            for cand in jg_candidates:
                if cand.get("individualPosition") == "JUNGLE":
                    rival_jg_data = cand
                    break
            else:
                rival_jg_data = jg_candidates[0]
        else:
            for opp in opponents:
                if opp.get("individualPosition") == "JUNGLE":
                    rival_jg_data = opp
                    break
            else:
                if opponents:
                    rival_jg_data = opponents[0]

        rival_jg_champion = rival_jg_data["championName"] if rival_jg_data else "Unknown"
        
        gold_diff_jg = user_data["goldEarned"] - rival_jg_data["goldEarned"] if rival_jg_data else 0
        xp_diff_jg = user_data["champExperience"] - rival_jg_data["champExperience"] if rival_jg_data else 0
        wards_placed = user_data.get("wardsPlaced", 0)
        wards_killed = user_data.get("wardsKilled", 0)
        
        challenges = user_data.get("challenges", {})
        solo_kills = int(challenges.get("soloKills", 0))
        enemy_jg_monsters = int(challenges.get("enemyJungleMonsterKills", 0))

        most_fed_enemy = max(opponents, key=lambda opp: opp["goldEarned"]) if opponents else None
        gold_diff_most_fed_enemy = user_data["goldEarned"] - most_fed_enemy["goldEarned"] if most_fed_enemy else 0
        largest_multikill = int(user_data.get("largestMultiKill", 0))

        participant_id = user_data["participantId"]
        level_6_minute = 0
        pre_six_deaths = 0
        gold_diff_10 = 0
        xp_diff_10 = 0
        full_clear_time = 0
        role_quest_time = 0
        gank_coords = []
        death_coords = []

        try:
            frames = timeline_payload["info"]["frames"]
            
            id_to_champ = {}
            for p in participants:
                id_to_champ[p["participantId"]] = p["championName"]

            for frame in frames:
                for event in frame.get("events", []):
                    if event.get("type") == "LEVEL_UP" and event.get("participantId") == participant_id and event.get("level") == 6:
                        level_6_minute = event["timestamp"] // 1000
                        break
                if level_6_minute > 0:
                    break
            if level_6_minute == 0:
                for idx, frame in enumerate(frames):
                    p_frame = frame["participantFrames"].get(str(participant_id))
                    if p_frame and p_frame.get("level", 0) >= 6:
                        level_6_minute = idx * 60
                        break

            for frame in frames:
                for event in frame.get("events", []):
                    if event.get("type") == "CHAMPION_KILL":
                        victim_id = event.get("victimId")
                        killer_id = event.get("killerId")
                        assistants = event.get("assistingParticipantIds", [])
                        timestamp = event.get("timestamp", 0)
                        pos = event.get("position", {})

                        if victim_id == participant_id:
                            death_coords.append({
                                "x": pos.get("x", 0),
                                "y": pos.get("y", 0),
                                "timestamp": timestamp,
                                "killer": id_to_champ.get(killer_id, "Unknown"),
                                "assists": [id_to_champ.get(aid, "Unknown") for aid in assistants]
                            })
                            if timestamp < 360000: # 6 minutes in ms
                                pre_six_deaths += 1
                        
                        if killer_id == participant_id or participant_id in assistants:
                            if timestamp <= 900000: # 15 minutes in ms
                                gank_coords.append({
                                    "x": pos.get("x", 0),
                                    "y": pos.get("y", 0),
                                    "timestamp": timestamp,
                                    "victim": id_to_champ.get(victim_id, "Unknown"),
                                    "killer": id_to_champ.get(killer_id, "Unknown"),
                                    "assists": [id_to_champ.get(aid, "Unknown") for aid in assistants]
                                })

                    # Check for role quest completion
                    if event.get("participantId") == participant_id:
                        evt_type = event.get("type")
                        item_id = event.get("itemId")
                        if evt_type == "ITEM_DESTROYED" and item_id in (1101, 1102, 1103, 3867):
                            role_quest_time = event["timestamp"] // 1000
                        elif evt_type == "ITEM_PURCHASED" and item_id in (3869, 3870, 3871, 3875, 3876):
                            role_quest_time = event["timestamp"] // 1000

            if len(frames) > 10:
                frame_10 = frames[10]
                p_frames = frame_10.get("participantFrames", {})
                user_frame = p_frames.get(str(participant_id))
                rival_frame = p_frames.get(str(rival_jg_data["participantId"])) if rival_jg_data else None
                if user_frame and rival_frame:
                    gold_diff_10 = user_frame["totalGold"] - rival_frame["totalGold"]
                    xp_diff_10 = user_frame["xp"] - rival_frame["xp"]
            else:
                last_frame = frames[-1]
                p_frames = last_frame.get("participantFrames", {})
                user_frame = p_frames.get(str(participant_id))
                rival_frame = p_frames.get(str(rival_jg_data["participantId"])) if rival_jg_data else None
                if user_frame and rival_frame:
                    gold_diff_10 = user_frame["totalGold"] - rival_frame["totalGold"]
                    xp_diff_10 = user_frame["xp"] - rival_frame["xp"]

            level_4_timestamp = 0
            for frame in frames:
                for event in frame.get("events", []):
                    if event.get("type") == "LEVEL_UP" and event.get("participantId") == participant_id and event.get("level") == 4:
                        ts_seconds = event["timestamp"] // 1000
                        if 150 <= ts_seconds <= 270: 
                            level_4_timestamp = ts_seconds
                            break
                if level_4_timestamp > 0:
                    break

            if level_4_timestamp > 0:
                full_clear_time = level_4_timestamp
            else:
                fc_frame_idx = -1
                for idx, frame in enumerate(frames):
                    p_frame = frame["participantFrames"].get(str(participant_id))
                    if p_frame:
                        cs = p_frame.get("minionsKilled", 0) + p_frame.get("jungleMinionsKilled", 0)
                        if cs >= 24:
                            fc_frame_idx = idx
                            break
                if fc_frame_idx != -1:
                    full_clear_time = frames[fc_frame_idx]["timestamp"] // 1000

        except Exception as e:
            print(f"Error calculating advanced metrics: {e}")
            pass

        game_creation_ms = info.get("gameStartTimestamp") or info.get("gameCreation") or 0
        game_date = datetime.fromtimestamp(game_creation_ms / 1000, tz=timezone.utc) if game_creation_ms else None
        first_blood_kill = user_data.get("firstBloodKill", False)

        user_build = [user_data.get(f"item{i}", 0) for i in range(7)]
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
            if p.get("teamId") == team_id:
                allies.append(p_data)
            else:
                enemies.append(p_data)
        teams = {"allies": allies, "enemies": enemies}

        is_hardcore = False
        if outcome == "L":
            has_afk = False
            has_feeder = False
            for p in participants:
                if p.get("teamId") == team_id and p.get("puuid") != user_puuid:
                    if p.get("hadAfkTeammate") or p.get("gameEndedInEarlySurrender"):
                        has_afk = True
                        break
                    tot_cs = p.get("totalMinionsKilled", 0) + p.get("neutralMinionsKilled", 0)
                    if game_duration >= 1200 and p.get("champLevel", 0) <= 10 and tot_cs <= 30:
                        has_afk = True
                        break
                    d = p.get("deaths", 0)
                    k = p.get("kills", 0)
                    a = p.get("assists", 0)
                    if d >= 10 and ((k + a) / max(1, d)) <= 0.5:
                        has_feeder = True
                        break

            allies_total_gold = sum(p.get("goldEarned", 0) for p in participants if p.get("teamId") == team_id)
            enemies_total_gold = sum(p.get("goldEarned", 0) for p in participants if p.get("teamId") != team_id)
            gold_deficit = allies_total_gold - enemies_total_gold

            if has_afk or has_feeder or gold_deficit <= -12000:
                is_hardcore = True

        gold_timeline_data = {"timeline": [], "events": []}
        try:
            if timeline_payload and "info" in timeline_payload and "frames" in timeline_payload["info"]:
                ally_participant_ids = {p["participantId"] for p in participants if p["teamId"] == team_id}
                frames = timeline_payload["info"]["frames"]
                for idx, frame in enumerate(frames):
                    minute = frame.get("timestamp", 0) // 60000
                    allies_gold = 0
                    enemies_gold = 0
                    for pid_str, p_frame in frame.get("participantFrames", {}).items():
                        pid = int(pid_str)
                        if pid in ally_participant_ids:
                            allies_gold += p_frame.get("totalGold", 0)
                        else:
                            enemies_gold += p_frame.get("totalGold", 0)
                    gold_timeline_data["timeline"].append({
                        "minute": minute,
                        "gold_diff": allies_gold - enemies_gold
                    })

                    for event in frame.get("events", []):
                        if event.get("type") == "ELITE_MONSTER_KILL":
                            m_type = event.get("monsterType")
                            killer_id = event.get("killerId", 0)
                            event_team = "allies" if killer_id in ally_participant_ids else "enemies"
                            gold_timeline_data["events"].append({
                                "minute": minute,
                                "type": m_type,
                                "team": event_team
                            })
        except Exception:
            pass

        return {
            "match_id": payload["metadata"]["matchId"],
            "puuid": user_puuid,
            "champion": champion,
            "rival_jg": rival_jg_champion,
            "outcome": outcome,
            "kda": kda,
            "cs_min": cs_min,
            "kill_participation": kill_participation,
            "damage_per_min": damage_per_min,
            "gold_per_min": gold_per_min,
            "control_wards": control_wards,
            "vision_score": vision_score,
            "time_spent_dead": time_spent_dead,
            "game_duration": game_duration,
            "gold_diff_jg": gold_diff_jg,
            "xp_diff_jg": xp_diff_jg,
            "wards_placed": wards_placed,
            "wards_killed": wards_killed,
            "solo_kills": solo_kills,
            "enemy_jg_monsters": enemy_jg_monsters,
            "gold_diff_most_fed_enemy": gold_diff_most_fed_enemy,
            "largest_multikill": largest_multikill,
            "level_6_minute": level_6_minute,
            "pre_six_deaths": pre_six_deaths,
            "gold_diff_10": gold_diff_10,
            "xp_diff_10": xp_diff_10,
            "full_clear_time": full_clear_time,
            "role_quest_time": role_quest_time,
            "user_summoner_id": user_data["summonerId"],
            "rival_jg_summoner_id": rival_jg_data["summonerId"] if rival_jg_data else None,
            "rival_jg_puuid": rival_jg_data["puuid"] if rival_jg_data else None,
            "riot_payload_raw": payload,
            "game_date": game_date,
            "first_blood_kill": first_blood_kill,
            "gank_coords": gank_coords,
            "death_coords": death_coords,
            "user_build": user_build,
            "teams": teams,
            "is_hardcore": is_hardcore,
            "gold_timeline": gold_timeline_data
        }

