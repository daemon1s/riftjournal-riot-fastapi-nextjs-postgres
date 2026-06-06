import React, { useState } from "react";
import { RIOT_VERSION } from "../config/constants";

interface Coord {
  x: number;
  y: number;
  timestamp: number;
  victim?: string;
  killer?: string;
  assists?: string[];
}

interface MatchMapProps {
  ganks?: Coord[];
  deaths?: Coord[];
}

function formatTimelineTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function getChampionIconUrl(name: string): string {
  if (!name || name === "Unknown") return "";
  return `https://ddragon.leagueoflegends.com/cdn/${RIOT_VERSION}/img/champion/${name}.png`;
}

export default function MatchMap({ ganks = [], deaths = [] }: MatchMapProps) {
  const [activeTab, setActiveTab] = useState<"all" | "ganks" | "deaths">("all");
  const [hoveredPoint, setHoveredPoint] = useState<{
    type: "gank" | "death";
    time: string;
    x: number;
    y: number;
    victim?: string;
    killer?: string;
    assists?: string[];
  } | null>(null);

  const safeGanks = ganks || [];
  const safeDeaths = deaths || [];

  // Normalize coordinates (0-15000 to 0-100%)
  const getPosition = (x: number, y: number) => {
    const left = Math.min(Math.max((x / 15000) * 100, 0), 100);
    const bottom = Math.min(Math.max((y / 15000) * 100, 0), 100);
    return { left: `${left}%`, bottom: `${bottom}%` };
  };

  const showGanks = activeTab === "all" || activeTab === "ganks";
  const showDeaths = activeTab === "all" || activeTab === "deaths";

  return (
    <div className="flex flex-col gap-3 bg-zinc-950/40 p-4 border border-[rgba(55,58,85,0.25)] rounded-2xl">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text">Análisis del Mapa</span>
          <h4 className="text-xs font-extrabold text-white uppercase mt-0.5">Ubicación de Eventos Clave</h4>
        </div>
        <div className="flex gap-1.5 bg-zinc-900/60 p-1 border border-[rgba(55,58,85,0.2)] rounded-xl text-[10px]">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg font-black uppercase transition-all ${activeTab === "all" ? "bg-accent-blue text-white" : "text-muted-text hover:text-white"
              }`}
          >
            Todo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ganks")}
            className={`px-2.5 py-1 rounded-lg font-black uppercase transition-all ${activeTab === "ganks" ? "bg-win-border text-win-text" : "text-muted-text hover:text-white"
              }`}
          >
            Ganks (15m)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deaths")}
            className={`px-2.5 py-1 rounded-lg font-black uppercase transition-all ${activeTab === "deaths" ? "bg-loss-border text-loss-text" : "text-muted-text hover:text-white"
              }`}
          >
            Muertes
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-[340px] aspect-square mx-auto rounded-xl overflow-hidden border border-[rgba(55,58,85,0.3)] bg-zinc-950 shadow-inner">
        {/* Summoner's Rift Map Image */}
        <img
          src="https://ddragon.leagueoflegends.com/cdn/6.8.1/img/map/map11.png"
          alt="Summoner's Rift"
          className="w-full h-full object-cover opacity-80"
          style={{ filter: "brightness(0.7) contrast(1.1)" }}
        />

        {/* Ganks Markers */}
        {showGanks &&
          safeGanks.map((pt, i) => {
            const pos = getPosition(pt.x, pt.y);
            return (
              <div
                key={`gank-${i}`}
                role="button"
                tabIndex={0}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-emerald-500 border border-white cursor-pointer transition-transform hover:scale-125 z-10 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                style={{ ...pos }}
                onMouseEnter={() =>
                  setHoveredPoint({
                    type: "gank",
                    time: formatTimelineTime(pt.timestamp),
                    x: pt.x,
                    y: pt.y,
                    victim: pt.victim,
                    killer: pt.killer,
                    assists: pt.assists,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
                onKeyDown={(e) => e.key === "Enter" && setHoveredPoint({ type: "gank", time: formatTimelineTime(pt.timestamp), x: pt.x, y: pt.y, victim: pt.victim, killer: pt.killer, assists: pt.assists })}
              />
            );
          })}

        {/* Deaths Markers */}
        {showDeaths &&
          safeDeaths.map((pt, i) => {
            const pos = getPosition(pt.x, pt.y);
            return (
              <div
                key={`death-${i}`}
                role="button"
                tabIndex={0}
                className="absolute w-3.5 h-3.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-rose-600 border border-white cursor-pointer transition-transform hover:scale-125 z-10 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                style={{ ...pos }}
                onMouseEnter={() =>
                  setHoveredPoint({
                    type: "death",
                    time: formatTimelineTime(pt.timestamp),
                    x: pt.x,
                    y: pt.y,
                    killer: pt.killer,
                    assists: pt.assists,
                  })
                }
                onMouseLeave={() => setHoveredPoint(null)}
                onKeyDown={(e) => e.key === "Enter" && setHoveredPoint({ type: "death", time: formatTimelineTime(pt.timestamp), x: pt.x, y: pt.y, killer: pt.killer, assists: pt.assists })}
              />
            );
          })}

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-3 left-3 bg-zinc-950/95 border border-[rgba(55,58,85,0.7)] backdrop-blur-md rounded-xl p-3 text-[10px] font-sans z-30 shadow-2xl flex flex-col gap-2 pointer-events-none w-56 text-left animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center gap-1.5 border-b border-[rgba(55,58,85,0.2)] pb-1.5">
              <span className={`w-2 h-2 rounded-full ${hoveredPoint.type === "gank" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" : "bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.8)]"}`} />
              <span className={`font-black uppercase tracking-wider ${hoveredPoint.type === "gank" ? "text-emerald-400" : "text-rose-400"}`}>
                {hoveredPoint.type === "gank" ? "Asesinato / Asist" : "Muerte"}
              </span>
              <span className="text-white font-mono ml-auto font-bold">{hoveredPoint.time}</span>
            </div>

            {hoveredPoint.type === "gank" ? (
              <div className="flex flex-col gap-1.5">
                {/* Victim */}
                {hoveredPoint.victim && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-text text-[9px] font-bold uppercase w-12">Víctima:</span>
                    <img src={getChampionIconUrl(hoveredPoint.victim)} className="w-5 h-5 rounded-md border border-[rgba(55,58,85,0.3)] object-cover" alt={hoveredPoint.victim} />
                    <span className="text-white font-extrabold">{hoveredPoint.victim}</span>
                  </div>
                )}
                {/* Killer */}
                {hoveredPoint.killer && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-text text-[9px] font-bold uppercase w-12">Asesino:</span>
                    <img src={getChampionIconUrl(hoveredPoint.killer)} className="w-5 h-5 rounded-md border border-[rgba(55,58,85,0.3)] object-cover" alt={hoveredPoint.killer} />
                    <span className={hoveredPoint.killer.toLowerCase().includes("evelynn") ? "text-accent-blue font-black" : "text-zinc-300 font-semibold"}>
                      {hoveredPoint.killer}
                    </span>
                  </div>
                )}
                {/* Assists */}
                {hoveredPoint.assists && hoveredPoint.assists.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-text text-[9px] font-bold uppercase">Asistentes:</span>
                    <div className="flex gap-1 flex-wrap">
                      {hoveredPoint.assists.map((champ, idx) => (
                        <img key={idx} src={getChampionIconUrl(champ)} className="w-4.5 h-4.5 rounded-md border border-[rgba(55,58,85,0.3)] object-cover" title={champ} alt={champ} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {/* Killer */}
                {hoveredPoint.killer && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-text text-[9px] font-bold uppercase w-12">Asesino:</span>
                    <img src={getChampionIconUrl(hoveredPoint.killer)} className="w-5 h-5 rounded-md border border-[rgba(55,58,85,0.3)] object-cover" alt={hoveredPoint.killer} />
                    <span className="text-white font-extrabold">{hoveredPoint.killer}</span>
                  </div>
                )}
                {/* Assists */}
                {hoveredPoint.assists && hoveredPoint.assists.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-muted-text text-[9px] font-bold uppercase">Asistentes:</span>
                    <div className="flex gap-1 flex-wrap">
                      {hoveredPoint.assists.map((champ, idx) => (
                        <img key={idx} src={getChampionIconUrl(champ)} className="w-4.5 h-4.5 rounded-md border border-[rgba(55,58,85,0.3)] object-cover" title={champ} alt={champ} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend / Info */}
      <div className="flex justify-between items-center text-[10px] text-muted-text font-semibold px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
          <span>Participación en kills (Pre-15m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_4px_rgba(244,63,94,0.6)]" />
          <span>Muertes del jugador</span>
        </div>
      </div>
    </div>
  );
}
