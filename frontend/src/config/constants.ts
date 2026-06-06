export const RIOT_VERSION = "15.11.1";

export const CHAMPION_DISPLAY_NAMES: Record<string, string> = {
  "LeeSin": "Lee Sin",
  "MonkeyKing": "Wukong",
  "XinZhao": "Xin Zhao",
  "JarvanIV": "Jarvan IV",
  "DrMundo": "Dr. Mundo",
  "TahmKench": "Tahm Kench",
  "TwistedFate": "Twisted Fate",
  "MasterYi": "Master Yi",
  "MissFortune": "Miss Fortune",
  "AurelionSol": "Aurelion Sol",
  "KogMaw": "Kog'Maw",
  "RekSai": "Rek'Sai",
  "Nunu": "Nunu & Willump",
  "Fiddlesticks": "Fiddlesticks",
  "BelVeth": "Bel'Veth",
  "Kaisa": "Kai'Sa",
  "Khazix": "Kha'Zix"
};

export interface SelectOption {
  value: string;
  label: string;
}

export const TILT_LEVELS: SelectOption[] = [
  { value: "NINGUNO", label: "Nivel 0: Modo frío total" },
  { value: "REACCION_INTERNA", label: "Nivel 1: Tensión física" },
  { value: "PERDIDA_LOGICA", label: "Nivel 2: Pérdida lógica" },
  { value: "CORTOCIRCUITO", label: "Nivel 3: Tilteado/Surrender" }
];

export const TRIGGER_CATEGORIES: SelectOption[] = [
  { value: "ERROR_PROPIO_MECANICO", label: "Error propio mecánico" },
  { value: "ERROR_PROPIO_DECISION", label: "Error propio de decisión" },
  { value: "INJUSTICIA_ALIADOS", label: "Injusticia de aliados" },
  { value: "COMPOSICION_ENEMIGA", label: "Composición enemiga" }
];

export const RECOVERY_TIMES: SelectOption[] = [
  { value: "INSTANTANEA", label: "Instantánea" },
  { value: "UN_CAMPAMENTO", label: "Un campamento" },
  { value: "TODA_LA_PARTIDA", label: "Toda la partida" },
  { value: "SOSTENIDA_SIGUIENTE_JUEGO", label: "Frustración residual para la próxima partida" }
];

export const MENTAL_VALUES_MAP: Record<string, string> = {
  "NINGUNO": "Ninguno",
  "REACCION_INTERNA": "Tensión física",
  "PERDIDA_LOGICA": "Pérdida lógica",
  "CORTOCIRCUITO": "Tilteado/Surrender",
  "ERROR_PROPIO_MECANICO": "Error mecánico",
  "ERROR_PROPIO_DECISION": "Error de decisión",
  "INJUSTICIA_ALIADOS": "Aliados",
  "COMPOSICION_ENEMIGA": "Draft",
  "INSTANTANEA": "Instantánea",
  "UN_CAMPAMENTO": "1 campamento",
  "TODA_LA_PARTIDA": "Toda la partida",
  "SOSTENIDA_SIGUIENTE_JUEGO": "Frustración residual"
};
