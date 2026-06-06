const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ErrorCatalogItem {
  id: number;
  error_text: string;
}

export interface TeamMember {
  champion: string;
  kda: string;
  build: number[];
  gold: number;
  damage: number;
}

export interface MatchupInfo {
  id: number;
  champion_name: string;
  counterplay: string | null;
}

export interface MatchSaveData {
  match_id: string;
  puuid: string;
  tilt_fase_maxima: string | null;
  trigger_categoria: string | null;
  recuperacion_tilt: string | null;
  match_notes: string | null;
  error_texts: string[];
  riot_payload_raw: any;
  user_tier?: string;
  user_rank?: string;
  user_lp?: number;
}

export interface MatchItem {
  id: number;
  match_id: string;
  played_at: string;
  champion: string;
  rival_jg: string;
  outcome: string;
  kda: string;
  cs_min: number;
  kill_participation: number;
  damage_per_min: number;
  gold_per_min: number;
  control_wards: number;
  vision_score: number;
  time_spent_dead: number;
  game_duration: number;
  gold_diff_jg: number;
  xp_diff_jg: number;
  custom_data?: any;
  wards_placed: number;
  wards_killed: number;
  solo_kills: number;
  enemy_jg_monsters: number;
  gold_diff_most_fed_enemy: number;
  largest_multikill: number;
  level_6_minute: number;
  full_clear_time?: number;
  role_quest_time?: number;
  user_tier?: string;
  user_rank?: string;
  user_lp?: number;
  rival_jg_tier?: string;
  rival_jg_rank?: string;
  tilt_fase_maxima: string | null;
  trigger_categoria: string | null;
  recuperacion_tilt: string | null;
  pre_six_deaths: number;
  gold_diff_10: number;
  xp_diff_10: number;
  match_notes: string | null;
  errors: ErrorCatalogItem[];
  game_date?: string;
  first_blood_kill?: boolean;
  gank_coords?: { x: number; y: number; timestamp: number; victim?: string; killer?: string; assists?: string[] }[];
  death_coords?: { x: number; y: number; timestamp: number; killer?: string; assists?: string[] }[];
  user_build?: number[];
  teams?: { allies: TeamMember[]; enemies: TeamMember[] };
  is_hardcore: boolean;
  gold_timeline?: {
    timeline: { minute: number; gold_diff: number }[];
    events: { minute: number; type: string; team: string }[];
  };
}

export interface RiotMatchPreview {
  match_id: string;
  puuid: string;
  champion: string;
  rival_jg: string;
  outcome: string;
  kda: string;
  cs_min: number;
  kill_participation: number;
  damage_per_min: number;
  gold_per_min: number;
  control_wards: number;
  vision_score: number;
  time_spent_dead: number;
  game_duration: number;
  gold_diff_jg: number;
  xp_diff_jg: number;
  wards_placed: number;
  wards_killed: number;
  solo_kills: number;
  enemy_jg_monsters: number;
  gold_diff_most_fed_enemy: number;
  largest_multikill: number;
  level_6_minute: number;
  full_clear_time?: number;
  role_quest_time?: number;
  user_tier?: string;
  user_rank?: string;
  user_lp?: number;
  rival_jg_tier?: string;
  rival_jg_rank?: string;
  pre_six_deaths: number;
  gold_diff_10: number;
  xp_diff_10: number;
  riot_payload_raw: any;
  game_date?: string;
  first_blood_kill?: boolean;
  gank_coords?: { x: number; y: number; timestamp: number; victim?: string; killer?: string; assists?: string[] }[];
  death_coords?: { x: number; y: number; timestamp: number; killer?: string; assists?: string[] }[];
  user_build?: number[];
  teams?: { allies: TeamMember[]; enemies: TeamMember[] };
  is_hardcore: boolean;
  gold_timeline?: {
    timeline: { minute: number; gold_diff: number }[];
    events: { minute: number; type: string; team: string }[];
  };
}

export interface RecentMatchItem {
  match_id: string;
  champion: string;
  kda: string;
  outcome: string;
  played_at: string;
  game_duration: number;
}

function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function login(password: string): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Incorrect password");
  }
  return res.json();
}

export async function verifyToken(): Promise<boolean> {
  const headers = getHeaders();
  if (!headers["Authorization"]) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/v1/auth/verify`, { headers });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getErrors(): Promise<ErrorCatalogItem[]> {
  const res = await fetch(`${API_BASE_URL}/v1/errors`);
  if (!res.ok) throw new Error("Failed to fetch error catalog");
  return res.json();
}

export async function getMatchup(championName: string): Promise<MatchupInfo> {
  const res = await fetch(`${API_BASE_URL}/v1/matchups/${encodeURIComponent(championName)}`);
  if (!res.ok) throw new Error("Failed to fetch matchup info");
  return res.json();
}

export async function updateMatchup(championName: string, counterplay: string): Promise<MatchupInfo> {
  const res = await fetch(`${API_BASE_URL}/v1/matchups/${encodeURIComponent(championName)}`, {
    method: "PUT",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ counterplay }),
  });
  if (!res.ok) throw new Error("Failed to update matchup info");
  return res.json();
}

export async function getMatches(): Promise<MatchItem[]> {
  const res = await fetch(`${API_BASE_URL}/v1/matches`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function getLatestMatch(riotId: string): Promise<RiotMatchPreview> {
  const res = await fetch(`${API_BASE_URL}/v1/matches/latest?riot_id=${encodeURIComponent(riotId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch latest match from Riot");
  }
  return res.json();
}

export async function getRecentMatches(riotId: string): Promise<RecentMatchItem[]> {
  const res = await fetch(`${API_BASE_URL}/v1/matches/recent?riot_id=${encodeURIComponent(riotId)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to fetch recent matches from Riot");
  }
  return res.json();
}

export async function getMatchPreview(matchId: string, puuid?: string, riotId?: string): Promise<RiotMatchPreview> {
  const params = new URLSearchParams();
  if (puuid) params.append("puuid", puuid);
  if (riotId) params.append("riot_id", riotId);
  const res = await fetch(`${API_BASE_URL}/v1/matches/preview/${encodeURIComponent(matchId)}?${params.toString()}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch preview for match ${matchId}`);
  }
  return res.json();
}



export async function saveMatch(data: MatchSaveData): Promise<MatchItem> {
  const res = await fetch(`${API_BASE_URL}/v1/matches/save`, {
    method: "POST",
    headers: getHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to save match tracker entry");
  }
  return res.json();
}

export async function deleteMatch(matchId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/v1/matches/${encodeURIComponent(matchId)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to delete match");
  }
  return res.json();
}
