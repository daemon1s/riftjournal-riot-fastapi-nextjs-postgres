"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy, Save, RotateCw, AlertTriangle, X, Trash2, LogIn, LogOut,
  ChevronDown, ChevronUp
} from "lucide-react";
import {
  getErrors, getMatchup, updateMatchup, getMatches, getLatestMatch, saveMatch, deleteMatch,
  verifyToken, MatchItem, RiotMatchPreview, getRecentMatches, getMatchPreview, RecentMatchItem
} from "../services/api";
import MultiSelectCombobox from "../components/MultiSelectCombobox";
import LoginModal from "../components/LoginModal";
import RecentMatchesModal from "../components/RecentMatchesModal";
import MatchMap from "../components/MatchMap";
import BackgroundParticles from "../components/BackgroundParticles";

import {
  RIOT_VERSION,
  CHAMPION_DISPLAY_NAMES,
  TILT_LEVELS,
  TRIGGER_CATEGORIES,
  RECOVERY_TIMES,
  MENTAL_VALUES_MAP
} from "../config/constants";

// Fallback icon helpers (used before riotVersion is resolved)
function _getChampionIconUrl(name: string, version: string): string {
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${name}.png`;
}
function _getItemIconUrl(itemId: number, version: string): string {
  if (!itemId || itemId === 0) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`;
}

function getDisplayChampionName(name: string): string {
  if (!name) return "";
  return CHAMPION_DISPLAY_NAMES[name] || name.replace(/([A-Z])/g, ' $1').trim();
}



function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatTimeSpentDead(seconds: number): string {
  if (seconds === 0) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function getMultikillBadge(count: number): React.ReactNode {
  if (count <= 1) return null;
  const labels: Record<number, string> = {
    2: "Doble",
    3: "Triple",
    4: "Cuádruple",
    5: "Pentakill"
  };
  const label = labels[count] || `${count} Kills`;
  const colors: Record<number, string> = {
    2: "bg-zinc-900/80 text-white border-zinc-700/60",
    3: "bg-accent-blue/15 text-accent-blue border-accent-blue/35 shadow-[0_0_10px_rgba(83,131,232,0.2)]",
    4: "bg-pink-500/15 text-pink-400 border-pink-500/35 shadow-[0_0_10px_rgba(236,72,153,0.2)]",
    5: "bg-yellow-500/15 text-yellow-400 border-yellow-500/35 shadow-[0_0_10px_rgba(234,179,8,0.3)]"
  };
  const colorClass = colors[count] || "bg-zinc-900/80 text-white border-zinc-700/60";
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono tracking-wider border ${colorClass}`}>
      {label}
    </span>
  );
}

function getRankIconUrl(tier: string | undefined): string {
  if (!tier) return "";
  const cleaned = tier.trim().toLowerCase();
  if (cleaned === "unranked" || cleaned === "") return "";
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/images/${cleaned}.png`;
}

function convertRomanToArabic(roman: string | undefined): string {
  if (!roman) return "";
  const map: Record<string, string> = {
    "I": "1",
    "II": "2",
    "III": "3",
    "IV": "4"
  };
  return map[roman.toUpperCase()] || roman;
}

function formatRank(tier: string | undefined, rank: string | undefined): string {
  if (!tier || tier.toUpperCase() === "UNRANKED") return "Unranked";
  const tierFormatted = tier.charAt(0) + tier.slice(1).toLowerCase();
  const rankArabic = convertRomanToArabic(rank);
  return `${tierFormatted} ${rankArabic}`;
}

function formatMentalValue(value: string | null | undefined): string {
  if (!value) return "Ninguno";
  if (value === "NINGUNO") return "Ninguno";
  return MENTAL_VALUES_MAP[value] || value;
}

function formatMentalValueShort(value: string | null | undefined): string {
  if (!value) return "Ninguno";
  return MENTAL_VALUES_MAP[value] || value;
}

interface MatchCompositionProps {
  teams: { allies: any[]; enemies: any[] } | undefined;
  goldTimeline: any;
  activeTab: "builds" | "damage" | "gold";
  onTabChange: (tab: "builds" | "damage" | "gold") => void;
  uniqueId: string;
  getChampionIconUrl: (name: string) => string;
  getItemIconUrl: (itemId: number) => string;
  getDisplayChampionName: (name: string) => string;
  ganks?: any[];
  deaths?: any[];
}

function MatchComposition({
  teams,
  goldTimeline,
  activeTab,
  onTabChange,
  uniqueId,
  getChampionIconUrl,
  getItemIconUrl,
  getDisplayChampionName,
  ganks = [],
  deaths = []
}: MatchCompositionProps) {
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null);
  const [hoveredEventIndex, setHoveredEventIndex] = useState<number | null>(null);

  if (!teams) return null;

  const formatGold = (gold: number) => {
    if (gold >= 1000) return `${(gold / 1000).toFixed(1)}k`;
    return String(gold);
  };

  const alliesTotalGold = teams.allies.reduce((sum, m) => sum + (m.gold || 0), 0);
  const enemiesTotalGold = teams.enemies.reduce((sum, m) => sum + (m.gold || 0), 0);

  const maxDamage = Math.max(
    ...teams.allies.map(m => m.damage || 0),
    ...teams.enemies.map(m => m.damage || 0),
    1
  );

  return (
    <div className="bg-zinc-950/20 p-5 border border-[rgba(55,58,85,0.15)] rounded-xl flex flex-col gap-4 h-full justify-between">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-text block font-black uppercase tracking-wider">
          {activeTab === "builds" ? "Composición de la partida" : activeTab === "damage" ? "Daño infligido en la partida" : "Evolución de la partida"}
        </span>
        <div className="flex gap-1">
          {(["builds", "damage", "gold"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onTabChange(t)}
              className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${activeTab === t
                  ? "bg-accent-blue/15 text-accent-blue border-accent-blue/30 shadow-[0_0_8px_rgba(83,131,232,0.15)]"
                  : "bg-transparent text-muted-text border-transparent hover:text-white"
                }`}
            >
              {t === "builds" ? "Builds & Oro" : t === "damage" ? "Daño" : "Evolución"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "builds" && (
        <div className="grid grid-cols-2 gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-win-text/10 pb-1">
              <span className="text-[10px] text-win-text font-black uppercase tracking-wider">Aliados</span>
              <span className="text-[10px] font-mono font-black text-win-text">{formatGold(alliesTotalGold)}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {teams.allies.map((member, idx) => (
                <div key={idx} className="p-0.5 rounded-lg">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={getChampionIconUrl(member.champion)} alt={member.champion} className="w-7 h-7 rounded-lg object-cover border border-win-border/20 shadow-sm flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] text-zinc-200 font-extrabold leading-tight truncate">{getDisplayChampionName(member.champion)}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-text font-mono font-bold leading-none">{member.kda}</span>
                          <div className="flex gap-0.5">
                            {member.build?.map((itemId: number, iIdx: number) => (
                              <div key={iIdx} className="w-3.5 h-3.5 rounded bg-zinc-950 border border-zinc-900/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {itemId > 0 && (
                                  <img src={getItemIconUrl(itemId)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-amber-500 flex-shrink-0">{formatGold(member.gold)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-loss-text/10 pb-1">
              <span className="text-[10px] text-loss-text font-black uppercase tracking-wider">Enemigos</span>
              <span className="text-[10px] font-mono font-black text-loss-text">{formatGold(enemiesTotalGold)}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              {teams.enemies.map((member, idx) => (
                <div key={idx} className="p-0.5 rounded-lg">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={getChampionIconUrl(member.champion)} alt={member.champion} className="w-7 h-7 rounded-lg object-cover border border-loss-border/20 shadow-sm flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] text-zinc-200 font-extrabold leading-tight truncate">{getDisplayChampionName(member.champion)}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-text font-mono font-bold leading-none">{member.kda}</span>
                          <div className="flex gap-0.5">
                            {member.build?.map((itemId: number, iIdx: number) => (
                              <div key={iIdx} className="w-3.5 h-3.5 rounded bg-zinc-950 border border-zinc-900/60 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {itemId > 0 && (
                                  <img src={getItemIconUrl(itemId)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-black text-amber-500 flex-shrink-0">{formatGold(member.gold)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "damage" && (
        <div className="grid grid-cols-2 gap-6 flex-1">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-win-text font-black uppercase tracking-wider border-b border-win-text/10 pb-1">Aliados</span>
            <div className="flex flex-col gap-3">
              {teams.allies.map((member, idx) => {
                const pct = ((member.damage || 0) / maxDamage) * 100;
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <img src={getChampionIconUrl(member.champion)} alt={member.champion} className="w-6 h-6 rounded-md object-cover border border-zinc-800" />
                        <span className="font-extrabold text-zinc-200">{getDisplayChampionName(member.champion)}</span>
                      </div>
                      <span className="font-mono text-zinc-300 font-bold">{member.damage?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-900/60 rounded-full h-2 overflow-hidden border border-zinc-800/50">
                      <div className="bg-pink-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] text-loss-text font-black uppercase tracking-wider border-b border-loss-text/10 pb-1">Enemigos</span>
            <div className="flex flex-col gap-3">
              {teams.enemies.map((member, idx) => {
                const pct = ((member.damage || 0) / maxDamage) * 100;
                return (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <img src={getChampionIconUrl(member.champion)} alt={member.champion} className="w-6 h-6 rounded-md object-cover border border-zinc-800" />
                        <span className="font-extrabold text-zinc-200">{getDisplayChampionName(member.champion)}</span>
                      </div>
                      <span className="font-mono text-zinc-300 font-bold">{member.damage?.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-900/60 rounded-full h-2 overflow-hidden border border-zinc-800/50">
                      <div className="bg-loss-text h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "gold" && (() => {
        const timeline = goldTimeline?.timeline || [];
        if (timeline.length === 0) {
          return <div className="text-center text-xs text-muted-text py-10">No hay datos de línea de tiempo de oro.</div>;
        }
        const minutes = timeline.map((t: any) => t.minute);
        const goldDiffs = timeline.map((t: any) => t.gold_diff);
        const maxMin = Math.max(...minutes, 1);
        const maxDiff = Math.max(...goldDiffs.map((d: any) => Math.abs(d)), 2000);

        const width = 500;
        const height = 200;
        const paddingX = 45;
        const paddingY = 20;

        const getX = (minute: number) => paddingX + (minute / maxMin) * (width - paddingX * 2);
        const getY = (diff: number) => {
          const chartHeight = height - paddingY * 2;
          const ratio = diff / maxDiff;
          return height / 2 - ratio * (chartHeight / 2);
        };

        const playerEvents: any[] = [];
        if (ganks) {
          ganks.forEach((g: any) => {
            playerEvents.push({
              minute: Math.floor(g.timestamp / 60000),
              type: "KILL",
              target: g.victim || "Enemigo",
              team: "allies",
              timestamp: g.timestamp
            });
          });
        }
        if (deaths) {
          deaths.forEach((d: any) => {
            playerEvents.push({
              minute: Math.floor(d.timestamp / 60000),
              type: "DEATH",
              target: d.killer || "Enemigo",
              team: "enemies",
              timestamp: d.timestamp
            });
          });
        }
        playerEvents.sort((a, b) => a.timestamp - b.timestamp);

        const pathD = `M ${timeline.map((pt: any) => `${getX(pt.minute)} ${getY(pt.gold_diff)}`).join(" L ")}`;
        const areaD = `M ${getX(timeline[0].minute)} ${height / 2} ${timeline.map((pt: any) => `L ${getX(pt.minute)} ${getY(pt.gold_diff)}`).join(" ")} L ${getX(timeline[timeline.length - 1].minute)} ${height / 2} Z`;

        const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relativeX = e.clientX - rect.left;
          const pct = relativeX / rect.width;
          const svgX = pct * width;
          const minVal = ((svgX - paddingX) / (width - paddingX * 2)) * maxMin;
          const currentMin = Math.round(minVal);
          setHoveredMinute(Math.max(0, Math.min(maxMin, currentMin)));
        };

        const handleMouseLeave = () => {
          setHoveredMinute(null);
          setHoveredEventIndex(null);
        };

        return (
          <div className="flex flex-col items-center w-full relative flex-1 justify-center">
            <div className="relative w-full flex justify-center flex-1 items-center">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto overflow-visible cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id={`goldGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38B6FF" />
                    <stop offset="50%" stopColor="#71717a" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id={`areaGrad-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38B6FF" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#71717a" stopOpacity="0" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#373a55" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1={paddingX} y1={getY(maxDiff * 0.5)} x2={width - paddingX} y2={getY(maxDiff * 0.5)} stroke="#18181b" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1={paddingX} y1={getY(-maxDiff * 0.5)} x2={width - paddingX} y2={getY(-maxDiff * 0.5)} stroke="#18181b" strokeWidth="0.5" strokeDasharray="2,2" />

                <text x={paddingX - 8} y={getY(maxDiff * 0.5) + 3} textAnchor="end" className="fill-muted-text font-mono text-[10px] font-black">+{formatGold(maxDiff * 0.5)}</text>
                <text x={paddingX - 8} y={height / 2 + 3} textAnchor="end" className="fill-muted-text font-mono text-[10px] font-black">0</text>
                <text x={paddingX - 8} y={getY(-maxDiff * 0.5) + 3} textAnchor="end" className="fill-muted-text font-mono text-[10px] font-black">-{formatGold(maxDiff * 0.5)}</text>

                {Array.from(new Set(timeline.map((pt: any) => pt.minute))).map((minute: any) => {
                  if (minute % 5 !== 0 && minute !== maxMin) return null;
                  return (
                    <g key={`grid-lbl-${minute}`}>
                      <line x1={getX(minute)} y1={paddingY} x2={getX(minute)} y2={height - paddingY} stroke="#18181b" strokeWidth="0.5" strokeDasharray="1,1" />
                      <text x={getX(minute)} y={height - 5} textAnchor="middle" className="fill-muted-text font-mono text-[10px] font-bold">{minute}m</text>
                    </g>
                  );
                })}

                <path d={areaD} fill={`url(#areaGrad-${uniqueId})`} />
                <path d={pathD} fill="none" stroke={`url(#goldGrad-${uniqueId})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {playerEvents.map((evt: any, idx: number) => {
                  const matchingFrame = timeline.find((t: any) => t.minute === evt.minute);
                  if (!matchingFrame) return null;
                  const cx = getX(evt.minute);
                  const cy = getY(matchingFrame.gold_diff);
                  const isHovered = hoveredMinute === evt.minute || hoveredEventIndex === idx;
                  return (
                    <g key={`event-${idx}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? "5.5" : "4.5"}
                        className={`${evt.team === "allies" ? "fill-emerald-500" : "fill-rose-500"} stroke-background`}
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {hoveredMinute !== null && (() => {
                  const currentFrame = timeline.find((t: any) => t.minute === hoveredMinute);
                  if (!currentFrame) return null;
                  return (
                    <line
                      x1={getX(hoveredMinute)}
                      y1={paddingY}
                      x2={getX(hoveredMinute)}
                      y2={height - paddingY}
                      stroke="rgba(83,131,232,0.4)"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  );
                })()}
              </svg>

              {hoveredMinute !== null && (() => {
                const currentFrame = timeline.find((t: any) => t.minute === hoveredMinute);
                if (!currentFrame) return null;
                const diff = currentFrame.gold_diff;
                const isPositive = diff >= 0;
                const minEvents = playerEvents.filter((evt: any) => evt.minute === hoveredMinute);

                return (
                  <div
                    className="absolute bg-zinc-950/95 border border-[rgba(55,58,85,0.6)] backdrop-blur-md rounded-xl p-3 text-[10px] z-30 shadow-2xl flex flex-col gap-1.5 pointer-events-none text-left"
                    style={{
                      left: `${(getX(hoveredMinute) / width) * 100}%`,
                      top: `${(getY(diff) / height) * 100 - 28}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="font-extrabold text-zinc-300">Minuto {hoveredMinute}</div>
                    <div className={`font-mono font-black ${isPositive ? "text-accent-blue" : "text-loss-text"}`}>
                      {isPositive ? `+${diff.toLocaleString()}g (Aliados)` : `${diff.toLocaleString()}g (Enemigos)`}
                    </div>
                    {minEvents.length > 0 && (
                      <div className="border-t border-[rgba(55,58,85,0.2)] pt-1 flex flex-col gap-1">
                        {minEvents.map((e: any, i: number) => (
                          <span key={i} className="text-zinc-300 font-bold">
                            {e.type === "KILL" ? "⚔️ Asesinato a " : "💀 Muerte por "} {e.target}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function Home() {
  const [riotId, setRiotId] = useState("angel tear#000");
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [preview, setPreview] = useState<RiotMatchPreview | null>(null);

  const [tiltFaseMaxima, setTiltFaseMaxima] = useState("NINGUNO");
  const [triggerCategoria, setTriggerCategoria] = useState("ERROR_PROPIO_MECANICO");
  const [recuperacionTilt, setRecuperacionTilt] = useState("INSTANTANEA");
  const [notes, setNotes] = useState("");
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);
  const [userTier, setUserTier] = useState("UNRANKED");
  const [userRank, setUserRank] = useState("");
  const [userLp, setUserLp] = useState(0);

  const [availableErrors, setAvailableErrors] = useState<string[]>([]);
  const [history, setHistory] = useState<MatchItem[]>([]);

  const [rivalJg, setRivalJg] = useState("");
  const [counterplay, setCounterplay] = useState("");
  const [isEditingCounterplay, setIsEditingCounterplay] = useState(false);
  const [isSavingCounterplay, setIsSavingCounterplay] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [isRecentMatchesOpen, setIsRecentMatchesOpen] = useState(false);
  const [recentMatches, setRecentMatches] = useState<RecentMatchItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [matchTabs, setMatchTabs] = useState<Record<string, "builds" | "damage" | "gold">>({});
  const [previewTab, setPreviewTab] = useState<"builds" | "damage" | "gold">("builds");
  const [riotVersion, setRiotVersion] = useState<string>(() => {
    // Use cached version immediately — avoids double image load on subsequent visits
    if (typeof window !== "undefined") {
      return localStorage.getItem("riot_ddragon_version") || RIOT_VERSION;
    }
    return RIOT_VERSION;
  });

  // Icon helpers that always use the freshest version
  const getChampionIconUrl = (name: string) => _getChampionIconUrl(name, riotVersion);
  const getItemIconUrl = (itemId: number) => _getItemIconUrl(itemId, riotVersion);

  useEffect(() => {
    loadData();
    checkAuth();
    // Fetch latest patch version from Riot CDN, cache it in localStorage
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(r => r.json())
      .then((versions: string[]) => {
        if (versions && versions.length > 0) {
          const latest = versions[0];
          localStorage.setItem("riot_ddragon_version", latest);
          setRiotVersion(latest);
        }
      })
      .catch(() => { /* keep cached/fallback version */ });
  }, []);

  const checkAuth = async () => {
    const isValid = await verifyToken();
    setIsAdmin(isValid);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAdmin(false);
    setPreview(null);
  };

  const loadData = async () => {
    try {
      const errs = await getErrors();
      setAvailableErrors(errs.map(e => e.error_text));
      const matches = await getMatches();
      setHistory(matches);
      if (matches.length > 0) {
        const latest = matches[0];
        setRivalJg(latest.rival_jg);
        const matchup = await getMatchup(latest.rival_jg);
        setCounterplay(matchup.counterplay || "");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSyncClick = async () => {
    setIsLoadingRecent(true);
    setErrorMsg(null);
    setRecentMatches([]);
    setIsRecentMatchesOpen(true);
    try {
      const data = await getRecentMatches(riotId);
      setRecentMatches(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al buscar partidas clasificatorias recientes");
      setIsRecentMatchesOpen(false);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleSelectMatch = async (matchId: string) => {
    setIsRecentMatchesOpen(false);
    setIsLoadingLatest(true);
    setErrorMsg(null);
    setPreview(null);
    try {
      const data = await getMatchPreview(matchId, undefined, riotId);
      setPreview(data);
      setRivalJg(data.rival_jg);

      const matchup = await getMatchup(data.rival_jg);
      setCounterplay(matchup.counterplay || "");

      setTiltFaseMaxima("NINGUNO");
      setTriggerCategoria("ERROR_PROPIO_MECANICO");
      setRecuperacionTilt("INSTANTANEA");
      setNotes("");
      setSelectedErrors([]);
      setUserTier(data.user_tier || "UNRANKED");
      setUserRank(data.user_rank || "");
      setUserLp(data.user_lp !== undefined ? data.user_lp : 0);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al buscar detalles de la partida");
    } finally {
      setIsLoadingLatest(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preview) return;
    setErrorMsg(null);
    try {
      await saveMatch({
        match_id: preview.match_id,
        puuid: preview.puuid,
        tilt_fase_maxima: tiltFaseMaxima,
        trigger_categoria: triggerCategoria,
        recuperacion_tilt: recuperacionTilt,
        match_notes: notes || null,
        error_texts: selectedErrors,
        riot_payload_raw: preview.riot_payload_raw,
        user_tier: userTier,
        user_rank: userRank,
        user_lp: userLp
      });
      setPreview(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al guardar el registro");
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("¿Seguro que quieres borrar este registro de partida?")) return;
    try {
      await deleteMatch(matchId);
      await loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleUpdateCounterplay = async () => {
    if (!rivalJg) return;
    setIsSavingCounterplay(true);
    try {
      await updateMatchup(rivalJg, counterplay);
      setIsEditingCounterplay(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingCounterplay(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      <BackgroundParticles />
      <main className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-6 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-1 w-full">
            <div className="relative group flex items-center gap-4 select-none py-1">
              <div className="absolute inset-0 -m-10 bg-[radial-gradient(circle,rgba(83,131,232,0.12)_0%,rgba(0,0,0,0)_70%)] blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse pointer-events-none"></div>
              <img
                src="/logazo.png"
                alt="Logo"
                className="h-24 w-auto object-contain relative z-10 logo-animated pointer-events-none"
              />
              <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter uppercase relative z-10 select-none pointer-events-none text-premium-animated mt-1">
                RiftJournal
              </h1>
            </div>

            {/* Controles abajo del logo */}
            <div className="flex items-center gap-4 mt-5 relative z-20">
              {isAdmin ? (
                <>
                  <div className="flex items-center bg-zinc-950/60 border border-[#38B6FF]/40 rounded-xl px-3 py-1.5 gap-2 shadow-inner">
                    <span className="text-[9px] bg-accent-blue/15 text-accent-blue border border-accent-blue/30 px-1.5 py-0.5 rounded font-black font-mono">LAS</span>
                    <input
                      type="text"
                      value={riotId}
                      onChange={(e) => setRiotId(e.target.value)}
                      className="bg-transparent text-xs font-mono text-white focus:outline-none w-40 text-left placeholder-muted-text/50 font-bold"
                    />
                  </div>
                  <button
                    onClick={handleSyncClick}
                    disabled={isLoadingRecent}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-[#38B6FF]/40 text-muted-text hover:text-white text-xs font-black rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw size={14} className={isLoadingRecent ? "animate-spin" : ""} />
                    Actualizar
                  </button>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-[#38B6FF]/40 text-muted-text hover:text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                    title="Cerrar sesión de administrador"
                  >
                    <LogOut size={14} />
                    <span>Salir</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-muted-text hover:text-white text-xs font-black rounded-xl transition-all cursor-pointer premium-border-beam"
                >
                  <LogIn size={14} />
                  Acceder Admin
                </button>
              )}
            </div>
          </div>
          {errorMsg && (
            <div className="p-4 bg-loss-text/10 border border-loss-text/30 text-loss-text rounded-xl flex items-center gap-3 animate-[fadeInUp_0.2s_ease-out]">
              <AlertTriangle size={18} />
              <p className="text-xs font-mono">{errorMsg}</p>
            </div>
          )}

          {isLoadingLatest && (
            <div className="bg-[rgba(19,20,28,0.7)] border border-[rgba(55,58,85,0.4)] backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center justify-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)] animate-[fadeInUp_0.2s_ease-out] min-h-[300px]">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-accent-blue/10"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-accent-blue border-r-accent-blue/40 animate-spin"></div>
              </div>
              <div className="text-center mt-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Consultando API de Riot Games</h3>
                <p className="text-[10px] text-muted-text uppercase tracking-widest mt-1.5 animate-pulse">
                  Procesando partida, elo y coordenadas del mapa...
                </p>
              </div>
            </div>
          )}

          {isAdmin && preview && (
            <form onSubmit={handleSave} className="bg-[rgba(19,20,28,0.7)] border border-[rgba(55,58,85,0.4)] backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)] animate-[fadeInUp_0.25s_ease-out]">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${preview.outcome === "W"
                ? "bg-win-text shadow-[2px_0_12px_rgba(83,131,232,0.35)]"
                : "bg-loss-text shadow-[2px_0_12px_rgba(232,64,87,0.35)]"
                }`}></div>

              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 ${preview.outcome === "W" ? "border-win-text/35" : "border-loss-text/35"
                    } bg-zinc-950 shadow-lg`}>
                    <img
                      src={getChampionIconUrl(preview.champion)}
                      alt={preview.champion}
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black font-mono tracking-wider border uppercase ${preview.outcome === "W"
                        ? "bg-win-bg text-win-text border-win-border"
                        : "bg-loss-bg text-loss-text border-loss-border"
                        }`}>
                        {preview.outcome === "W" ? "Victoria" : "Derrota"}
                      </span>
                      {preview.largest_multikill > 1 && getMultikillBadge(preview.largest_multikill)}
                      {preview.is_hardcore && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black font-mono border bg-pink-500/15 text-pink-400 border-pink-500/35 shadow-[0_0_8px_rgba(236,72,153,0.25)] uppercase whitespace-nowrap">
                          Inganable
                        </span>
                      )}
                      {preview.first_blood_kill && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono border bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.25)] uppercase whitespace-nowrap" title="First Blood">
                          FB
                        </span>
                      )}
                      <span className="text-[10px] text-muted-text font-bold font-mono">DURACIÓN: {formatDuration(preview.game_duration)}</span>
                    </div>
                    <h2 className="text-lg font-black mt-1 text-white uppercase tracking-tight">Partida Pendiente de Registro</h2>
                  </div>
                </div>

                {userTier && userTier.toUpperCase() !== "UNRANKED" && (
                  <div className="flex items-center gap-2 bg-zinc-950/40 border border-[rgba(55,58,85,0.25)] px-3.5 py-2 rounded-xl">
                    <img
                      src={getRankIconUrl(userTier)}
                      alt={userTier}
                      className="w-10 h-10 object-contain"
                    />
                    <div className="text-left">
                      <span className="text-[9px] text-muted-text block leading-none font-bold uppercase tracking-wider">Elo Partida</span>
                      <span className="text-xs font-black text-white font-mono">{formatRank(userTier, userRank)}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="text-muted-text hover:text-white p-1 hover:bg-zinc-800/40 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rival JG */}
                <div className="bg-zinc-950/30 p-4 border border-[rgba(55,58,85,0.25)] rounded-xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[rgba(55,58,85,0.3)] bg-zinc-950">
                    <img
                      src={getChampionIconUrl(preview.rival_jg)}
                      alt={preview.rival_jg}
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] text-muted-text block font-bold uppercase tracking-wider">Jungla rival</span>
                    <span className="font-extrabold text-white text-sm block">{getDisplayChampionName(preview.rival_jg)}</span>
                    {preview.rival_jg_tier && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {preview.rival_jg_tier.toUpperCase() !== "UNRANKED" && (
                          <img
                            src={getRankIconUrl(preview.rival_jg_tier)}
                            alt={preview.rival_jg_tier}
                            className="w-4 h-4 object-contain"
                          />
                        )}
                        <span className="text-[9px] text-accent-blue font-bold font-mono leading-none">
                          {preview.rival_jg_tier.toUpperCase() !== "UNRANKED"
                            ? `${preview.rival_jg_tier.charAt(0) + preview.rival_jg_tier.slice(1).toLowerCase()} ${convertRomanToArabic(preview.rival_jg_rank)}`
                            : "Unranked"
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KDA & CS/min */}
                <div className="bg-zinc-950/30 p-4 border border-[rgba(55,58,85,0.25)] rounded-xl grid grid-cols-2 gap-2 text-center">
                  <div className="border-r border-[rgba(55,58,85,0.15)] flex flex-col justify-center">
                    <span className="text-[9px] text-muted-text block font-bold uppercase tracking-wider">KDA</span>
                    <span className="font-mono font-black text-white text-base mt-0.5">{preview.kda}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-[9px] text-muted-text block font-bold uppercase tracking-wider">CS/min</span>
                    <span className="font-mono font-black text-white text-base mt-0.5">{preview.cs_min}</span>
                  </div>
                </div>

                {/* KP% */}
                <div className="bg-zinc-950/30 p-4 border border-[rgba(55,58,85,0.25)] rounded-xl grid grid-cols-2 gap-2 text-center">
                  <div className="border-r border-[rgba(55,58,85,0.15)] flex flex-col justify-center col-span-2">
                    <span className="text-[9px] text-muted-text block font-bold uppercase tracking-wider">KP%</span>
                    <span className="font-mono font-black text-accent-blue text-base mt-0.5">{preview.kill_participation}%</span>
                  </div>
                </div>
              </div>

              {/* Performance stats */}
              <div className="border-t border-[rgba(55,58,85,0.2)] pt-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Rendimiento</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[
                    { label: "DPM", value: String(preview.damage_per_min) },
                    { label: "Oro/min", value: String(preview.gold_per_min) },
                    { label: "Tiempo muerto", value: formatTimeSpentDead(preview.time_spent_dead) },
                    { label: "Solo kills", value: String(preview.solo_kills) },
                    { label: "Camps robados", value: String(preview.enemy_jg_monsters) },
                    { label: "Full Clear", value: preview.full_clear_time && preview.full_clear_time > 0 ? formatDuration(preview.full_clear_time) : "—" },
                    { label: "Quest", value: preview.role_quest_time && preview.role_quest_time > 0 ? formatDuration(preview.role_quest_time) : "—" },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-2 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                      <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                      <span className="font-mono font-black text-white text-sm block">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vision stats */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Visión</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { label: "Wards control", value: String(preview.control_wards) },
                    { label: "Wards colocados", value: String(preview.wards_placed) },
                    { label: "Wards destruidos", value: String(preview.wards_killed) },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-3 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                      <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                      <span className="font-mono font-black text-white text-sm block">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diff stats grid */}
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Diferencias</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {[
                    { label: "Dif. Oro JG", value: preview.gold_diff_jg },
                    { label: "Dif. XP JG", value: preview.xp_diff_jg },
                    { label: "GD@10", value: preview.gold_diff_10 },
                    { label: "XPD@10", value: preview.xp_diff_10 },
                    { label: "Dif. Oro Más Fed", value: preview.gold_diff_most_fed_enemy },
                  ].map(stat => (
                    <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-2 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                      <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                      <span className={`font-mono font-black text-sm block ${stat.value >= 0 ? "text-win-text" : "text-loss-text"}`}>
                        {stat.value >= 0 ? `+${stat.value}` : stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Muertes Pre-6 and other stats summary */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950/20 p-3.5 border border-[rgba(55,58,85,0.15)] rounded-xl text-center text-xs">
                <div>
                  <span className="text-[9px] text-muted-text block mb-0.5 font-bold uppercase tracking-wider">Muertes Pre-6</span>
                  <span className={`font-mono font-black text-xs ${preview.pre_six_deaths > 0 ? "text-loss-text" : "text-white"}`}>
                    {preview.pre_six_deaths}
                  </span>
                </div>
                <div className="border-l border-[rgba(55,58,85,0.15)]">
                  <span className="text-[9px] text-muted-text block mb-0.5 font-bold uppercase tracking-wider">Nivel 6</span>
                  <span className="font-mono font-black text-white text-xs">{formatDuration(preview.level_6_minute)}</span>
                </div>
              </div>

              {/* Map and Build/Teams grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[rgba(55,58,85,0.2)] pt-4 items-start">
                {/* Map */}
                <MatchMap
                  ganks={preview.gank_coords}
                  deaths={preview.death_coords}
                />

                {/* Build & Teams */}
                <div className="flex flex-col gap-4">
                  {/* Build */}
                  <div className="bg-zinc-950/20 p-4 border border-[rgba(55,58,85,0.15)] rounded-xl flex flex-col gap-2">
                    <span className="text-[9px] text-muted-text block font-bold uppercase tracking-wider">Tu Build</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {preview.user_build?.map((itemId, idx) => (
                        <div key={idx} className="w-10 h-10 rounded-lg border border-[rgba(55,58,85,0.3)] bg-zinc-950/80 overflow-hidden flex items-center justify-center">
                          {itemId > 0 ? (
                            <img src={getItemIconUrl(itemId)} alt={`Item ${itemId}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <span className="text-[9px] text-zinc-600 font-mono">Vacío</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teams */}
                  <MatchComposition
                    teams={preview.teams}
                    goldTimeline={preview.gold_timeline}
                    activeTab={previewTab}
                    onTabChange={setPreviewTab}
                    uniqueId="preview"
                    getChampionIconUrl={getChampionIconUrl}
                    getItemIconUrl={getItemIconUrl}
                    getDisplayChampionName={getDisplayChampionName}
                    ganks={preview.gank_coords}
                    deaths={preview.death_coords}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/15 p-5 border border-[rgba(55,58,85,0.25)] rounded-xl">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Fase de tilt máxima</label>
                    <select
                      value={tiltFaseMaxima}
                      onChange={(e) => setTiltFaseMaxima(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-950/60 border border-[rgba(55,58,85,0.3)] rounded-xl text-xs text-white font-bold focus:outline-none focus:border-accent-blue"
                    >
                      {TILT_LEVELS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#13141c]">{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {tiltFaseMaxima !== "NINGUNO" && (
                  <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-[rgba(55,58,85,0.15)] pt-4 md:pt-0 md:pl-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Detonante (Trigger)</label>
                      <select
                        value={triggerCategoria}
                        onChange={(e) => setTriggerCategoria(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-950/60 border border-[rgba(55,58,85,0.3)] rounded-xl text-xs text-white font-bold focus:outline-none focus:border-accent-blue"
                      >
                        {TRIGGER_CATEGORIES.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#13141c]">{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Recuperación de tilt</label>
                      <select
                        value={recuperacionTilt}
                        onChange={(e) => setRecuperacionTilt(e.target.value)}
                        className="w-full px-3 py-2.5 bg-zinc-950/60 border border-[rgba(55,58,85,0.3)] rounded-xl text-xs text-white font-bold focus:outline-none focus:border-accent-blue"
                      >
                        {RECOVERY_TIMES.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#13141c]">{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">¿Qué errores cometiste?</label>
                <MultiSelectCombobox
                  availableTags={availableErrors}
                  selectedTags={selectedErrors}
                  onChange={setSelectedErrors}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-text">Notas de partida (descargos rápidos)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Escribe detalles tácticos o emocionales de la partida..."
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-[rgba(55,58,85,0.3)] rounded-xl text-xs placeholder-muted-text/50 focus:outline-none focus:border-accent-blue transition-colors resize-none text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-zinc-950/40 hover:bg-zinc-900/60 border border-[rgba(55,58,85,0.3)] text-muted-text hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                Guardar registro
              </button>
            </form>
          )}

          <div className="flex flex-col gap-4">
            {(() => {
              const lostMatches = history.filter(m => m.outcome === "L");
              const totalLosses = lostMatches.length;
              const hardcoreLosses = lostMatches.filter(m => m.is_hardcore).length;
              const hardcorePercentage = totalLosses > 0 ? Math.round((hardcoreLosses / totalLosses) * 100) : 0;
              if (totalLosses === 0) return null;
              return (
                <div className="pt-2.5 pb-3.5 px-4 bg-zinc-950/40 border border-[rgba(55,58,85,0.3)] rounded-xl flex items-center justify-between shadow-inner animate-[fadeInUp_0.25s_ease-out]">
                  <div>
                    <span className="text-[10px] text-muted-text uppercase font-black tracking-widest">Mental Saver</span>
                    <h4 className="text-sm font-extrabold text-white mt-1">
                      El <span className="text-pink-500 font-mono">{hardcorePercentage}%</span> de tus derrotas fueron clasificadas como inganables
                    </h4>
                    <p className="text-[10px] text-muted-text mt-0.5">El algoritmo detectó AFKs, feeders extremos o diferencias irrecuperables en tu equipo.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black font-mono text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1 rounded-lg">
                      {hardcoreLosses} / {totalLosses} L
                    </span>
                  </div>
                </div>
              );
            })()}

            {history.length === 0 ? (
              <p className="text-xs text-muted-text py-4 font-bold uppercase tracking-wider">No se han registrado partidas aún.</p>
            ) : (
              <div className="bg-[rgba(19,20,28,0.6)] border border-[rgba(55,58,85,0.3)] backdrop-blur-xl rounded-2xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[rgba(55,58,85,0.4)]">
                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-text w-8"></th>
                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-text">Campeón</th>
                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-widest text-muted-text">Rival JG</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">W/L</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">Elo</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">KDA</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">CS/m</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">KP%</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">Full Clear</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">Lvl 6</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">Quest</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text">Muertes Pre-6</th>
                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-text w-24"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows: React.ReactNode[] = [];
                        let lastDate = "";
                        history.forEach((item, index) => {
                          const matchDate = new Date(item.game_date || item.played_at).toLocaleDateString("es-CL", {
                            day: "2-digit", month: "long", year: "numeric"
                          });
                          const isExpanded = expandedMatchId === item.match_id;

                          // Date divider row
                          if (matchDate !== lastDate) {
                            lastDate = matchDate;
                            rows.push(
                              <tr key={`date-${matchDate}-${index}`}>
                                <td colSpan={13} className="px-4 py-2 bg-accent-blue/8 border-y border-accent-blue/15">
                                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-accent-blue/80">{matchDate}</span>
                                </td>
                              </tr>
                            );
                          }

                          // Main data row
                          rows.push(
                            <tr
                              key={item.match_id}
                              onClick={() => setExpandedMatchId(isExpanded ? null : item.match_id)}
                              className={`border-b border-[rgba(55,58,85,0.2)] transition-all duration-150 cursor-pointer group ${item.outcome === "W"
                                ? "hover:bg-win-bg/30"
                                : "hover:bg-loss-bg/30"
                                } ${isExpanded ? (item.outcome === "W" ? "bg-win-bg/20" : "bg-loss-bg/20") : ""}`}
                            >
                              {/* Color accent bar via left border */}
                              <td className={`w-1 p-0 ${item.outcome === "W" ? "border-l-2 border-win-text" : "border-l-2 border-loss-text"}`}></td>

                              {/* Champion */}
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-3.5">
                                  <div className={`w-11 h-11 rounded-xl overflow-hidden border-2 flex-shrink-0 ${item.outcome === "W" ? "border-win-text/40" : "border-loss-text/40"} bg-zinc-950 shadow-md`}>
                                    <img src={getChampionIconUrl(item.champion)} alt={item.champion} className="w-full h-full object-cover scale-110" />
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-extrabold text-white text-sm whitespace-nowrap leading-none">{item.champion}</span>
                                      {item.largest_multikill > 1 && getMultikillBadge(item.largest_multikill)}
                                      {item.is_hardcore && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono border bg-pink-500/15 text-pink-400 border-pink-500/35 shadow-[0_0_8px_rgba(236,72,153,0.25)] uppercase whitespace-nowrap">
                                          Inganable
                                        </span>
                                      )}
                                      {item.first_blood_kill && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono border bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.25)] uppercase whitespace-nowrap" title="First Blood">
                                          FB
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-0.5">
                                      {item.user_build?.map((itemId, idx) => (
                                        <div key={idx} className="w-5 h-5 rounded bg-zinc-950 border border-zinc-800/80 overflow-hidden flex items-center justify-center flex-shrink-0">
                                          {itemId > 0 && (
                                            <img src={getItemIconUrl(itemId)} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Rival JG */}
                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-[rgba(55,58,85,0.4)] bg-zinc-950 flex-shrink-0">
                                    <img src={getChampionIconUrl(item.rival_jg)} alt={item.rival_jg} className="w-full h-full object-cover scale-110" />
                                  </div>
                                  <span className="font-semibold text-zinc-300 text-sm whitespace-nowrap">{getDisplayChampionName(item.rival_jg)}</span>
                                </div>
                              </td>

                              {/* W/L */}
                              <td className="px-3 py-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className={`px-2.5 py-1 rounded text-xs font-black font-mono border uppercase ${item.outcome === "W"
                                    ? "bg-win-bg text-win-text border-win-border"
                                    : "bg-loss-bg text-loss-text border-loss-border"
                                    }`}>
                                    {item.outcome}
                                  </span>
                                </div>
                              </td>

                              {/* Elo */}
                              <td className="px-3 py-4 text-center">
                                {item.user_tier && item.user_tier.toUpperCase() !== "UNRANKED" ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <img src={getRankIconUrl(item.user_tier)} alt={item.user_tier} className="w-5 h-5 object-contain" />
                                    <span className="text-xs font-black text-zinc-300 font-mono whitespace-nowrap">
                                      {item.user_tier.charAt(0)}{convertRomanToArabic(item.user_rank)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-text font-bold">—</span>
                                )}
                              </td>

                              {/* KDA */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-black text-white text-sm">{item.kda}</span>
                              </td>

                              {/* CS/min */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-semibold text-zinc-200 text-sm">{item.cs_min}</span>
                              </td>

                              {/* KP% */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-black text-accent-blue text-sm">{item.kill_participation}%</span>
                              </td>

                              {/* Full Clear */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-semibold text-zinc-200 text-sm">
                                  {item.full_clear_time && item.full_clear_time > 0 ? formatDuration(item.full_clear_time) : "—"}
                                </span>
                              </td>

                              {/* Level 6 */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-semibold text-zinc-200 text-sm">{formatDuration(item.level_6_minute)}</span>
                              </td>

                              {/* Quest */}
                              <td className="px-3 py-4 text-center">
                                <span className="font-mono font-semibold text-zinc-200 text-sm">
                                  {item.role_quest_time && item.role_quest_time > 0 ? formatDuration(item.role_quest_time) : "—"}
                                </span>
                              </td>

                              {/* Pre-6 Deaths */}
                              <td className="px-3 py-4 text-center">
                                {item.pre_six_deaths > 0 ? (
                                  <span className="px-2 py-0.5 rounded text-xs font-black font-mono border bg-loss-bg text-loss-text border-loss-border">
                                    {item.pre_six_deaths}
                                  </span>
                                ) : (
                                  <span className="text-sm text-muted-text font-bold">0</span>
                                )}
                              </td>

                              {/* Expand toggle */}
                              <td className="px-3 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setExpandedMatchId(isExpanded ? null : item.match_id); }}
                                  className={`flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${isExpanded
                                    ? "bg-accent-blue/15 text-accent-blue border-accent-blue/30"
                                    : "bg-zinc-950/40 text-muted-text border-[rgba(55,58,85,0.3)] hover:bg-zinc-900/60 hover:text-white"
                                    }`}
                                >
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  {isExpanded ? "Ocultar" : "Detalles"}
                                </button>
                              </td>
                            </tr>
                          );

                          // Accordion details row
                          if (isExpanded) {
                            rows.push(
                              <tr key={`details-${item.match_id}`}>
                                <td colSpan={13} className="p-0">
                                  <div className={`m-2 rounded-xl border overflow-hidden ${item.outcome === "W"
                                    ? "bg-[rgba(24,34,69,0.3)] border-[rgba(83,131,232,0.2)]"
                                    : "bg-[rgba(52,22,32,0.3)] border-[rgba(232,64,87,0.2)]"
                                    }`}>
                                    {/* Details header */}
                                    <div className="px-5 py-3 border-b border-[rgba(55,58,85,0.2)] flex items-center justify-between">
                                      <div className="flex items-center gap-2.5">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border uppercase ${item.outcome === "W"
                                          ? "bg-win-bg text-win-text border-win-border"
                                          : "bg-loss-bg text-loss-text border-loss-border"
                                          }`}>{item.outcome === "W" ? "Victoria" : "Derrota"}</span>
                                        <span className="text-[10px] font-black text-white">
                                          {new Date(item.game_date || item.played_at).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                        <span className="text-[10px] text-muted-text">•</span>
                                        <span className="text-[10px] font-mono font-bold text-zinc-400">{formatDuration(item.game_duration)}</span>
                                        {item.largest_multikill > 1 && getMultikillBadge(item.largest_multikill)}
                                        {item.is_hardcore && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono border bg-pink-500/15 text-pink-400 border-pink-500/35 shadow-[0_0_8px_rgba(236,72,153,0.25)] uppercase whitespace-nowrap">
                                            Inganable
                                          </span>
                                        )}
                                        {item.first_blood_kill && (
                                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black font-mono border bg-amber-500/15 text-amber-400 border-amber-500/35 shadow-[0_0_8px_rgba(245,158,11,0.25)] uppercase whitespace-nowrap" title="First Blood">
                                            FB
                                          </span>
                                        )}
                                      </div>
                                      {isAdmin && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteMatch(item.match_id)}
                                          className="p-1.5 text-zinc-500 hover:text-loss-text hover:bg-loss-text/10 rounded-lg transition-all cursor-pointer"
                                          title="Borrar registro"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      )}
                                    </div>

                                    <div className="p-4 flex flex-col gap-6">
                                      {/* Performance stats */}
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Rendimiento</p>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                                          {[
                                            { label: "DPM", value: String(item.damage_per_min) },
                                            { label: "Oro/min", value: String(item.gold_per_min) },
                                            { label: "Tiempo muerto", value: formatTimeSpentDead(item.time_spent_dead) },
                                            { label: "Solo kills", value: String(item.solo_kills) },
                                            { label: "Camps robados", value: String(item.enemy_jg_monsters) },
                                            { label: "Full Clear", value: item.full_clear_time && item.full_clear_time > 0 ? formatDuration(item.full_clear_time) : "—" },
                                            { label: "Quest", value: item.role_quest_time && item.role_quest_time > 0 ? formatDuration(item.role_quest_time) : "—" },
                                          ].map(stat => (
                                            <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-2 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                              <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                                              <span className="font-mono font-black text-white text-sm block">{stat.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Vision stats */}
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Visión</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                          {[
                                            { label: "Wards control", value: String(item.control_wards) },
                                            { label: "Wards colocados", value: String(item.wards_placed) },
                                            { label: "Wards destruidos", value: String(item.wards_killed) },
                                          ].map(stat => (
                                            <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-3 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                              <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                                              <span className="font-mono font-black text-white text-sm block">{stat.value}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Diff stats grid */}
                                      <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-text mb-2">Diferencias</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                                          {[
                                            { label: "Dif. Oro JG", value: item.gold_diff_jg },
                                            { label: "Dif. XP JG", value: item.xp_diff_jg },
                                            { label: "GD@10", value: item.gold_diff_10 },
                                            { label: "XPD@10", value: item.xp_diff_10 },
                                            { label: "Dif. Oro Más Fed", value: item.gold_diff_most_fed_enemy },
                                          ].map(stat => (
                                            <div key={stat.label} className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-2 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                              <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">{stat.label}</span>
                                              <span className={`font-mono font-black text-sm block ${stat.value >= 0 ? "text-win-text" : "text-loss-text"}`}>
                                                {stat.value >= 0 ? `+${stat.value}` : stat.value}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Mental stats */}
                                      {item.tilt_fase_maxima && item.tilt_fase_maxima !== "NINGUNO" && (
                                        <div className="grid grid-cols-3 gap-2.5">
                                          <div className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-3 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                            <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">Fase Tilt</span>
                                            <span className="font-black text-loss-text text-sm block">{formatMentalValueShort(item.tilt_fase_maxima)}</span>
                                          </div>
                                          <div className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-3 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                            <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">Detonante</span>
                                            <span className="font-bold text-white text-sm block truncate">{formatMentalValueShort(item.trigger_categoria)}</span>
                                          </div>
                                          <div className="bg-zinc-950/25 border border-[rgba(55,58,85,0.25)] rounded-xl py-3.5 px-3 text-center flex flex-col justify-center min-h-[72px] hover:bg-zinc-950/40 transition-colors shadow-inner">
                                            <span className="text-[10px] text-muted-text font-black uppercase tracking-widest block leading-tight mb-1">Recuperación</span>
                                            <span className="font-bold text-white text-sm block truncate">{formatMentalValueShort(item.recuperacion_tilt)}</span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Errors */}
                                      {item.errors.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                          {item.errors.map(err => (
                                            <span key={err.id} className="text-[10px] font-bold bg-zinc-950/60 border border-[rgba(55,58,85,0.25)] text-zinc-300 px-2.5 py-0.5 rounded-full">
                                              {err.error_text}
                                            </span>
                                          ))}
                                        </div>
                                      )}

                                      {/* Map and Build/Teams grid */}
                                      {/* Map and Teams grid */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[rgba(55,58,85,0.15)] pt-4 items-start">
                                        {/* Map */}
                                        <MatchMap
                                          ganks={item.gank_coords}
                                          deaths={item.death_coords}
                                        />

                                        {/* Teams Composition */}
                                        <MatchComposition
                                          teams={item.teams}
                                          goldTimeline={item.gold_timeline}
                                          activeTab={matchTabs[item.match_id] || "builds"}
                                          onTabChange={(tab) => setMatchTabs(prev => ({ ...prev, [item.match_id]: tab }))}
                                          uniqueId={item.match_id}
                                          getChampionIconUrl={getChampionIconUrl}
                                          getItemIconUrl={getItemIconUrl}
                                          getDisplayChampionName={getDisplayChampionName}
                                          ganks={item.gank_coords}
                                          deaths={item.death_coords}
                                        />
                                      </div>

                                      {/* Notes */}
                                      {item.match_notes && (
                                        <p className="text-[11px] text-zinc-300 bg-zinc-950/20 px-3 py-2.5 rounded-xl border border-[rgba(55,58,85,0.15)] italic leading-relaxed">
                                          "{item.match_notes}"
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        });
                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={() => setIsAdmin(true)}
      />

      <RecentMatchesModal
        isOpen={isRecentMatchesOpen}
        onClose={() => setIsRecentMatchesOpen(false)}
        matches={recentMatches}
        onSelectMatch={handleSelectMatch}
        isLoading={isLoadingRecent}
      />
    </div>
  );
}
