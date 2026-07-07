# RiftJournal

<p align="center">
  <img src="./frontend/public/logazo.png" alt="RiftJournal Logo" width="220px"/>
</p>

<p align="center">
  <strong>Plataforma inteligente de optimización del rendimiento y mental game para League of Legends.</strong>
</p>

<p align="center">
  <a href="https://github.com/daemon1s/riftjournal-riot-fastapi-nextjs-postgres/actions/workflows/deploy.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/daemon1s/riftjournal-riot-fastapi-nextjs-postgres/deploy.yml?branch=main&label=Compilaci%C3%B3n%20y%20despliegue&logo=github&style=flat-square" alt="Compilación y despliegue"/>
  </a>
  <img src="https://img.shields.io/badge/Next.js-15+-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <a href="https://sonarcloud.io/summary/new_code?id=daemon1s_riftjournal-riot-fastapi-nextjs-postgres">
    <img src="https://img.shields.io/badge/SonarCloud-Security%20Grade%20A-4E9BCD?style=flat-square&logo=sonarcloud&logoColor=white" alt="SonarCloud Security"/>
  </a>
</p>

<p align="center">
  <a href="https://riftjournal.daemon1s.dev/">
    <img src="https://img.shields.io/badge/DEMO%20EN%20VIVO-HTTPS%3A%2F%2FRIFTJOURNAL.daemon1s.DEV-007EC6?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Demo en Vivo"/>
  </a>
</p>

---

## 📋 Descripción del proyecto

**RiftJournal** es una suite analítica completa diseñada para jugadores de League of Legends. Permite registrar partidas directamente desde la API oficial de Riot Games y cruzar métricas avanzadas de rendimiento en el juego con variables emocionales y psicológicas (control de tilt, detonantes y recuperación) mediante notas de mental y estadísticas personalizadas.

El objetivo es automatizar la auditoría de rendimiento y mentalidad para acelerar el aprendizaje y evitar rachas de derrotas innecesarias (*tilt-induced losses*).

---

## 🛠️ Stack tecnológico

- **Frontend (interfaz de usuario)**
  - **Next.js 15+ (App Router)** y React para una interfaz fluida e interacciones instantáneas.
  - **Tailwind CSS v4** para un diseño adaptativo premium con estilo gaming darkmode.
  - **Gráficos SVG interactivos** para la evolución minuto a minuto del oro y eventos de objetivos épicos.
  - **Lucide Icons** para consistencia visual.

- **Backend (API y lógica de negocios)**
  - **FastAPI (Python 3.11)** para el manejo asíncrono y de alto rendimiento de solicitudes.
  - **SQLAlchemy (Async)** con controlador **Asyncpg** para la interacción no bloqueante con la base de datos.
  - **Pytest** para la validación automatizada de seguridad y generación de JWT.
  - **Ruff** para asegurar código limpio y ordenado según PEP 8.

- **Base de datos**
  - **PostgreSQL 15 (Alpine)** persistido localmente y en el host mediante volúmenes Docker aislados de accesos externos.

- **Infraestructura y seguridad**
  - **Docker y Docker Compose** para la contenedorización y portabilidad.
  - **Nginx Proxy Manager** actuando como proxy reverso para certificados SSL y enrutamiento seguro.
  - **SonarCloud** para el escaneo continuo de vulnerabilidades y seguridad del código (Calificación Grado A).

---

## 📂 Estructura de carpetas

El repositorio está organizado en un monorepo con la siguiente estructura de directorios:

```text
performance-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Pipeline de integración y despliegue continuo (CI/CD)
├── backend/                    # Servidor de API (FastAPI)
│   ├── app/
│   │   ├── api/                # Enrutadores y controladores de la API (v1)
│   │   ├── models/             # Modelos de base de datos (SQLAlchemy)
│   │   ├── schemas/            # Schemas de validación Pydantic
│   │   ├── services/           # Lógica de negocio (Riot API y base de datos)
│   │   └── main.py             # Punto de entrada de la aplicación FastAPI
│   ├── tests/                  # Pruebas unitarias y de integración (Pytest)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                   # Aplicación cliente (Next.js)
│   ├── public/                 # Recursos gráficos y de assets (logotipos, iconos)
│   ├── src/
│   │   ├── app/                # Páginas, layouts y ruteo (App Router)
│   │   ├── components/         # Componentes React reutilizables (MatchMap, LoginModal, etc.)
│   │   ├── config/             # Constantes y configuraciones globales
│   │   └── services/           # Clientes e integración con la API del backend
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml          # Orquestación de contenedores (db, backend, frontend)
├── sonar-project.properties    # Configuración de SonarCloud
└── README.md
```

---

## ⚡ Cómo funciona el consumo de la API de Riot Games

Cuando el administrador solicita sincronizar o previsualizar una partida, el backend de FastAPI realiza un flujo de consultas asíncronas a los servidores de Riot Games:

1. **Resolución de identidad (`SUMMONER-V4`)**:
   - Recibe el Riot ID del usuario (`Nombre#Tag`) y solicita su identificador único persistente interno conocido como **PUUID**.

2. **Obtención del historial (`MATCH-V5`)**:
   - Con el PUUID, el backend consulta la lista de los últimos 10 IDs de partidas clasificatorias SoloQ.
   - Para cada partida seleccionada, descarga el payload con los detalles del juego (KDA, CS, duración, resultado, builds de ítems, etc.).
   - **Detección del jungla rival**: El backend busca en el equipo contrario al jugador que tenga equipado el hechizo **Smite (Castigo)**. Si hay ambigüedad o múltiples Smite, desempata seleccionando al jugador cuya posición individual (`individualPosition`) sea estrictamente `"JUNGLE"`.

3. **Análisis de línea temporal (`MATCH-TIMELINE-V5`)**:
   - **Momento del Nivel 6**: Recorre el historial de eventos segundo a segundo para encontrar el timestamp exacto en que el jugador llegó a nivel 6 (un hito clave de escalado para muchos campeones).
   - **GD@10 y XPD@10**: Consulta la diferencia neta de oro y experiencia acumulada en el frame del minuto 10 frente al jungla rival.
   - **Muertes Pre-6**: Cuenta las muertes del jugador ocurridas antes del segundo `360` (minuto 6).
   - **Coordenadas de ganks y muertes**: Extrae las coordenadas espaciales `(X, Y)` de los asesinatos antes del minuto 15 (ganks exitosos) y de todas las muertes del jugador. Estos puntos se normalizan y escalan para dibujarse sobre el mapa de la Grieta del Invocador en el frontend.

4. **Clasificación y rango (`LEAGUE-V4`)**:
   - Consulta el Tier, División y LP actuales tanto del jugador como del jungla oponente en el momento del registro.

Toda esta información es consolidada en el backend, se asocia a las variables emocionales del mental tracker, y se guarda en la base de datos PostgreSQL local, sirviendo también las peticiones del dashboard de Next.js.

---

## 📊 Estructura de datos (PostgreSQL)

La tabla principal `matches` está optimizada para persistir las métricas de rendimiento tradicionales y las métricas avanzadas obtenidas del timeline de Riot:

- **Rendimiento**: KDA, CS/min, oro acumulado, primera sangre, multikill máxima, tiempo de finalización del objeto de jungla (`role_quest_time`) y tiempo del primer campamento completo (`full_clear_time`).
- **Liga**: Rangos reales del jugador (`user_tier`, `user_rank`, `user_lp`) y del jungla rival (`rival_jg_tier`, `rival_jg_rank`).
- **Líneas temporales**: Minuto del Nivel 6, diferencia de oro y experiencia al minuto 10 (`gold_diff_10`, `xp_diff_10`), muertes pre-6, y diferencia de oro contra el enemigo más fuerte de la partida.
- **Mental game**: Nivel máximo de tilt (0 a 3), detonantes específicos (comportamiento de aliados, errores mecánicos, etc.) y tiempo de recuperación.
- **Coordenadas y timeline**: JSONB con coordenadas de ganks, muertes y la lista minuto a minuto de oro neto global.

---

## 🚀 Proceso de integración y despliegue continuo (CI/CD)

El despliegue está automatizado mediante un pipeline de **GitHub Actions** configurado en el archivo `deploy.yml`. El proceso se ejecuta de la siguiente manera:

1. **Trigger**: El pipeline se activa automáticamente en cada `git push` a la rama `main` (cuando se modifican carpetas clave como frontend, backend o archivos de docker).
2. **Fase de análisis de calidad y pruebas (QA)**:
   - Se descarga el código y se configura un entorno virtual de Python.
   - **Ruff** analiza el código de Python para asegurar buenas prácticas PEP 8.
   - **Pytest** ejecuta las pruebas unitarias del backend (autenticación y tokens JWT).
   - Se descarga e instala Node.js para el frontend.
   - **ESLint y TypeScript (tsc)** validan que el código React/Next.js no tenga errores de tipos ni malas prácticas.
   - **Vitest** corre las pruebas de componentes en el frontend.
   - **SonarCloud** realiza un escaneo estático de seguridad sobre todo el proyecto para evitar vulnerabilidades de inyección de APIs o Path Traversal.
3. **Fase de compilación y publicación**:
   - Si todas las pruebas pasan, el pipeline compila las imágenes de producción de Docker para el frontend y el backend.
   - Las imágenes resultantes se suben a **GitHub Container Registry (GHCR)** con la etiqueta `:latest`.
4. **Fase de despliegue en VPS**:
   - GitHub Actions se conecta por SSH a la VPS de DigitalOcean usando llaves privadas configuradas en GitHub Secrets.
   - Actualiza el código del repositorio en la VPS haciendo un reset a la rama `main`.
   - Genera un archivo `.env` dinámico inyectando los secretos necesarios (contraseñas de base de datos, API Key de Riot, variables JWT, etc.).
   - Ejecuta `docker compose pull` para bajar las imágenes recién compiladas de GHCR.
   - Ejecuta `docker compose up -d --wait` para reiniciar los servicios de forma limpia y transparente para el usuario.
   - Ejecuta `docker image prune -f` para eliminar imágenes huérfanas y liberar espacio en disco.

### Arquitectura de producción y puertos:
Para evitar colisiones en la VPS y mantener un entorno seguro, los puertos están estructurados de la siguiente forma:

- **Frontend (Next.js)**: Escucha internamente en el puerto `3000` del contenedor y se mapea externamente al puerto **`3010`** de la VPS.
- **Backend API (FastAPI)**: Escucha internamente en el puerto `8000` del contenedor y se mapea externamente al puerto **`8010`** de la VPS.
- **Base de datos (PostgreSQL)**: Se ejecuta en un contenedor privado. Se eliminó la exposición de puertos hacia el exterior (`5432:5432` eliminado), restringiendo el acceso exclusivamente a la red interna virtual de Docker (`proxy-network`). El tráfico de base de datos está completamente aislado de internet.
- **Nginx Proxy Manager**: Resuelve las peticiones HTTPS desde el exterior y las redirige de forma segura a los puertos locales mapeados (`3010` y `8010`).
