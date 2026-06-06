import React from "react";
import { X, Calendar, Clock, Sword, BarChart2 } from "lucide-react";
import { RecentMatchItem } from "../services/api";
import { RIOT_VERSION, CHAMPION_DISPLAY_NAMES } from "../config/constants";

interface RecentMatchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: RecentMatchItem[];
  onSelectMatch: (matchId: string) => void;
  isLoading: boolean;
}

function getDisplayChampionName(name: string): string {
  if (!name) return "";
  return CHAMPION_DISPLAY_NAMES[name] || name.replace(/([A-Z])/g, ' $1').trim();
}

function getChampionIconUrl(name: string): string {
  if (!name) return "";
  return `https://ddragon.leagueoflegends.com/cdn/${RIOT_VERSION}/img/champion/${name}.png`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function RecentMatchesModal({
  isOpen,
  onClose,
  matches,
  onSelectMatch,
  isLoading,
}: RecentMatchesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar modal"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity w-full cursor-default"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-[#030611]/95 border border-[rgba(55,58,85,0.45)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all flex flex-col gap-5 text-white animate-[fadeInUp_0.25s_ease-out]">
        <div className="flex items-center justify-between border-b border-[rgba(55,58,85,0.2)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center text-accent-blue shadow-[0_0_15px_rgba(83,131,232,0.15)]">
              <BarChart2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white leading-tight">Partidas clasificatorias recientes</h3>
              <p className="text-xs text-muted-text">Selecciona cuál deseas auditar y registrar en el tracker</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-text hover:text-white transition-colors p-1.5 hover:bg-zinc-800/40 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
            <p className="text-sm text-muted-text font-medium">Buscando partidas en la API de Riot...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">¡Todo al día!</h4>
              <p className="text-xs text-muted-text max-w-sm mt-1 mx-auto">
                No se encontraron partidas clasificatorias nuevas en tus últimas 10 jugadas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-zinc-950/40 hover:bg-zinc-900/60 border border-[rgba(55,58,85,0.3)] text-muted-text hover:text-white text-xs font-black rounded-xl transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-bold text-muted-text uppercase tracking-wider px-1">
              Partidas pendientes ({matches.length})
            </div>
            <div className="max-h-96 overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
              {matches.map((match) => (
                <div
                  key={match.match_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMatch(match.match_id)}
                  onKeyDown={(e) => e.key === "Enter" && onSelectMatch(match.match_id)}
                  className={`group relative border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all duration-200 hover:translate-y-[-1px] shadow-md ${match.outcome === "W"
                      ? "bg-[rgba(24,34,69,0.25)] border-[rgba(83,131,232,0.15)] hover:border-[rgba(83,131,232,0.3)] hover:bg-[rgba(24,34,69,0.4)]"
                      : "bg-[rgba(52,22,32,0.25)] border-[rgba(232,64,87,0.15)] hover:border-[rgba(232,64,87,0.3)] hover:bg-[rgba(52,22,32,0.4)]"
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 ${match.outcome === "W" ? "border-win-text/30" : "border-loss-text/30"
                      } bg-zinc-950 flex-shrink-0 shadow-lg`}>
                      <img
                        src={getChampionIconUrl(match.champion)}
                        alt={match.champion}
                        className="w-full h-full object-cover scale-110 group-hover:scale-120 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm font-sans tracking-tight">
                          {getDisplayChampionName(match.champion)}
                        </span>
                        <span
                          className={`text-[9px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${match.outcome === "W"
                              ? "bg-win-bg text-win-text border-win-border"
                              : "bg-loss-bg text-loss-text border-loss-border"
                            }`}
                        >
                          {match.outcome === "W" ? "W" : "L"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-text font-medium flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Sword size={12} className="text-muted-text/60" />
                          KDA: <strong className="text-white font-black">{match.kda}</strong>
                        </span>
                        <span className="text-muted-text/30 font-bold">|</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock size={12} className="text-muted-text/60" />
                          {formatDuration(match.game_duration)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[rgba(55,58,85,0.15)] pt-2 sm:pt-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-text font-mono">
                      <Calendar size={12} className="text-muted-text/60" />
                      {new Date(match.played_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <button className="px-4 py-1.5 bg-zinc-950/40 hover:bg-zinc-900/60 border border-[rgba(55,58,85,0.3)] text-muted-text hover:text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm">
                      Auditar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
