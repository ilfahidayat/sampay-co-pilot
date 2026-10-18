<div align="center">

# 🐟 Sampay Aquaculture Co-Pilot (SAC) Platform
### Autonomous AI Operating System for Biofloc Aquaculture with Real-Time Multi-Agent IoT & Edge Telemetry

[![Google Cloud AI Cup](https://img.shields.io/badge/Google%20Cloud-AI%20Cup%202026-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)
[![Gemini Generative AI](https://img.shields.io/badge/Google%20Gemini-3.8%20%2F%202.5%20Flash-8E75C2?logo=google&logoColor=white)](https://aistudio.google.com/)
[![MQTT Protocol](https://img.shields.io/badge/IoT%20Protocol-MQTT%20v5%20WebSockets-005C8A?logo=mqtt&logoColor=white)](https://mqtt.org/)
[![Vue 3](https://img.shields.io/badge/Frontend-Vue%203%20%2B%20Vite-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%208.x%20(Knex.js)-003B57?logo=mysql&logoColor=white)](https://knexjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

*An end-to-end autonomous aquaculture intelligence platform combining real-time edge microcontroller telemetry (ESP32), industrial Modbus/Relay actuators, scientific biofloc microbiology principles (Avnimelech C:N 15:1), and Google Gemini Generative AI with Function Calling for closed-loop pond management.*

---

</div>

## 📑 Table of Contents

1. [Competition & Track Information](#-competition--track-information)
2. [Scientific Biofloc Foundation](#-scientific-biofloc-foundation)
3. [System Architecture](#-system-architecture)
4. [Core Platform Features](#-core-platform-features)
5. [Prerequisites](#-prerequisites)
6. [Step-by-Step Installation](#-step-by-step-installation)
7. [Database Setup, Migrations & Seeding](#-database-setup-migrations--seeding)
8. [Environment Configuration](#-environment-configuration)
9. [Running the Platform](#-running-the-platform)
10. [Feature Walkthrough & Usage Guide](#-feature-walkthrough--usage-guide)
11. [MQTT IoT Protocol Specification](#-mqtt-iot-protocol-specification)
12. [REST API Reference](#-rest-api-reference)
13. [Troubleshooting & FAQ](#-troubleshooting--faq)
14. [License](#-license)

---

## 🏆 Competition & Track Information

- **Competition:** Google Cloud AI Cup 2026
- **Track:** **Autonomous AI & Machine Learning Track / Gemini AI Track**
- **Domain:** Precision Agriculture / Aquaculture Decision Support & Closed-Loop Autonomous IoT Control
- **Core AI Engine:** Google Gemini 3.8 Flash / 2.5 Flash with Multimodal Function Calling, RAG (Retrieval-Augmented Generation) Biofloc Knowledge Base, Real-Time MQTT Ingestion, and Reactive WebSocket Client.

### The Biological Aquaculture Challenge
Modern biofloc aquaculture achieves high stocking density ($30\text{–}50\text{ kg/m}^3$) with near-zero water exchange by cultivating dense heterotrophic bacteria that convert toxic Total Ammonia Nitrogen ($TAN$) into consumable microbial protein. However, biofloc ecosystems are biologically volatile:
1. **Acute Hypoxia Emergencies:** Both fish biomass and dense microbial flocs consume oxygen continuously (*dual respiration*). A drop below $4.0\text{ mg/L}$ can trigger acute stress and mass mortality within 30 minutes if aerator VFD speed is not immediately elevated.
2. **Ammonia Toxicity ($TAN$):** Insufficient carbon-to-nitrogen balance ($C:N < 15:1$) suppresses heterotrophic assimilation, causing toxic ammonia spikes.
3. **Sludge Overload & Organic Decay:** Over-application of molasses or delayed bottom siphoning leads to anaerobic sludge accumulation ($>25\text{ mL/L}$ Imhoff cone), collapsing pond biological integrity.

**SAC solves this via a 3-tier Autonomous AI Architecture:**
- **Edge Layer:** Real-time ingestion of 5 key water quality parameters ($DO$, $pH$, Water Temp, $TAN$, Floc Density) from ESP32 edge gateways over MQTT.
- **Autonomous AI Specialist Guard:** Autonomous closed-loop guard continuously evaluating biometric parameters, predicting mortality risks, and automatically dispatching corrective actions (e.g., 100% aerator boost or emergency siphon).
- **Natural Language Operations (NLOps):** Farm supervisors command the platform using natural language in English or Indonesian via Google Gemini with Function Calling tools.

---

## 🔬 Scientific Biofloc Foundation

SAC embeds peer-reviewed biofloc microbiology and aquaculture engineering standards (Avnimelech, Ebeling, Timmons):

| Principle | Formula / Biological Mechanism | SAC Automated Implementation |
|---|---|---|
| **Heterotrophic Assimilation** | $\text{NH}_4^+ + 1.18\,\text{C}_6\text{H}_{12}\text{O}_6 + \text{HCO}_3^- + 3.57\,\text{O}_2 \rightarrow \text{C}_5\text{H}_7\text{O}_2\text{N} + 3.08\,\text{CO}_2 + 5.48\,\text{H}_2\text{O}$ | Computes cane molasses dosing required to maintain optimal Carbon:Nitrogen ($C:N$) ratio between 15:1 and 20:1. |
| **Strict Molasses Quota** | Restricted to 1–3 applications per production cycle | Prevents dangerous microbial population explosions, excessive sludge buildup, and nocturnal DO crashes. Enforces *Zero Carbon Standby* once biofloc matures. |
| **Dual Respiration Aeration** | Continuous DO baseline $\ge 5.0\text{ mg/L}$ | VFD frequency inverter modulates paddlewheel and blower speeds between 60% and 100% based on real-time biomass demand. |
| **Zero-Water Exchange Siphon** | Selective anaerobic bottom sludge purge ($150\text{–}300\text{ L}$) | Automatically triggered when 15-minute Imhoff cone settled floc exceeds $20\text{ mL/L}$. |
| **3x Feeding Chronobiology** | Morning (08:00 WIB), Noon (12:30 WIB), Afternoon (17:00 WIB) | Automatic partition of daily ration ($2.2\%\text{–}2.8\%$ of standing biomass) to match diurnal fish metabolic rates. |

---

## 🏛️ System Architecture

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      ESP32 IoT Pond Simulator (Port 5177)                  │
 │   • 4 Independent Edge Nodes (Ponds K01, K02, K03, K04)                     │
 │   • 5 Biometric Sensors: Optical DO, pH, Temperature, Ammonia TAN, Floc     │
 │   • 4 Industrial Actuators: Aerator VFD, Auto-Feeder, Molasses, Siphon      │
 │   • Crisis Scenarios: Optimal, Acute Hypoxia, Ammonia Spike, Sludge Overload│
 └───────────────────────────────▲─────────────────────────────────────────────┘
                                 │ MQTT over WebSockets (Topic: sac/+/telemetry)
                                 ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      Backend Ingestion Engine (Port 5050)                   │
 │   • Express.js REST API + MQTT Broker Bridge (EMQX / Mosquitto)             │
 │   • MySQL 8.x Database via Knex.js (Migrations, Seeders, Repositories)      │
 │   • Clean Architecture: Presentation, Services, Domain, Infrastructure      │
 │   • Google Gemini 3.8 Flash Client: Function Calling, NLOps & Diagnostics   │
 └───────────────────────────────▲─────────────────────────────────────────────┘
                                 │ REST APIs + Real-Time MQTT Stream
                                 ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       SAC Frontend Dashboard (Port 5175)                    │
 │   • Pond Overview & Real-Time Biometric Radial Gauges                       │
 │   • Water Quality Diagnostic Suite & High-Density Telemetry Charts          │
 │   • Daily Treatment Hub (Checklist Table & Chronological Timeline)          │
 │   • Equipment & Sensor Matrix (Symmetrical Bilateral Edge Node Cards)       │
 │   • Interactive Gemini AI Co-Pilot with Real-Time Function Action Cards     │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Clean Architecture Directory Layout

```text
SAC/
├── backend/                      # Node.js + Express + Knex.js Backend Server
│   ├── config/                   # Knex configuration (knexfile.js)
│   ├── migrations/               # Database schema versioning
│   ├── seeds/                    # Seed initial ponds, sensors, logs, and treatments
│   ├── src/
│   │   ├── config/               # Database connection (mysql2) and environment configs
│   │   ├── infrastructure/       # Gemini GenAI client, Mock engine, MQTT protocol services
│   │   ├── presentation/         # Express REST routes & controllers
│   │   ├── repositories/         # Database access layer (Data Mapper pattern)
│   │   ├── services/             # Core AI biological evaluation & execution logic
│   │   └── index.js              # Application entrypoint (Port 5050)
│   ├── .env.example              # Environment variables template
│   └── package.json
│
├── frontend/                     # Vue 3 + Vite Web Application Dashboard
│   ├── src/
│   │   ├── assets/               # Brand styling and fonts
│   │   ├── components/           # Navbar, Sidebar, Radial Gauges, Modals, Co-Pilot Drawer
│   │   ├── composables/          # Reactive composables (usePonds, useCopilot, useDailyExecution)
│   │   ├── router/               # Vue Router 4 routes
│   │   ├── services/             # Axios API client & browser MQTT streaming services
│   │   ├── views/                # DashboardView, WaterTelemetryView, DailyExecutionView, etc.
│   │   ├── App.vue               # Root layout wrapper
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
│
├── simulator/                    # ESP32 IoT Microcontroller Simulator
│   ├── src/
│   │   ├── components/           # CompactNodeCard, AdjustSensorModal, BrokerConfigModal
│   │   ├── services/             # Simulation physics engine & MQTT client
│   │   ├── App.vue               # Simulator dashboard & controls
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js
│
├── scripts/                      # Developer automation scripts
│   └── dev-all.js                # Unified concurrent runner for all 3 services
├── start.sh                      # Shell launch script
├── package.json                  # Root monorepo orchestrator
└── README.md                     # Comprehensive platform documentation
```

---

## 🌟 Core Platform Features

### 1. 📊 Real-Time Biometric Gauges & Telemetry Streaming
- High-precision radial gauge dials for all 5 parameters:
  - **Dissolved Oxygen ($DO$):** Optimal $5.0\text{–}7.5\text{ mg/L}$, critical danger $< 4.0\text{ mg/L}$.
  - **pH Level:** Optimal $7.2\text{–}7.8$, critical bounds $< 6.8$ or $> 8.5$.
  - **Water Temperature:** Optimal $28.0\text{–}30.0\text{ }^\circ\text{C}$.
  - **Total Ammonia Nitrogen ($TAN$):** Optimal $< 0.05\text{ ppm}$, toxic alert $> 0.15\text{ ppm}$.
  - **Floc Density (15-min Imhoff Cone):** Optimal $10\text{–}20\text{ mL/L}$, purge alert $> 20\text{ mL/L}$.
- Zero page refresh: Updates stream instantaneously via MQTT over WebSockets.

### 2. 🤖 Gemini-Powered Autonomous Biological Guard
- **Continuous Health Scoring (0–100):** Weighted multi-parameter evaluation classifying pond status as `OPTIMAL`, `WARNING`, or `CRITICAL`.
- **Automated Closed-Loop Actuator Dispatch:** If critical hypoxia or ammonia elevation is detected, the AI automatically dispatches emergency actuator commands (`AERATOR_MAX_100` or `EMERGENCY_SIPHON`) to edge nodes with complete audit logging.
- **Scientific Diagnostic Summaries:** Natural-language biological explanations produced by Gemini 3.8 Flash grounded in Avnimelech microbial principles.

### 3. 🗓️ Daily Treatment Hub (4-Pillar Biofloc Checklist)
- **1. Aerator Speed Control (06:00 WIB):** Calibrates VFD power percentage ($70\%\text{–}100\%$) and motor RPM ($1,050\text{–}1,500\text{ RPM}$).
- **2. Feed Dispense #1 Morning (08:00 WIB):** 30% of calculated daily ration.
- **3. Water Exchange & Sludge Siphon (10:30 WIB):** Selective bottom sludge purge ($150\text{–}300\text{ L}$).
- **4. Feed Dispense #2 Noon (12:30 WIB):** 40% of daily ration during peak temperature.
- **5. Molasses C:N Balancing (14:30 WIB):** Organic carbon injection (strictly enforced to 1–3 applications per cycle).
- **6. Feed Dispense #3 Afternoon (17:00 WIB):** 30% of daily ration before nocturnal cooling.
- **Interactive Checklist Features:** One-click approval, real-time manual adjustment modals, immediate IoT execution, CSV audit export, and database reset.

### 4. 💬 NLOps Co-Pilot with Function Calling Tools
Farm supervisors can interact via text or voice in English or Indonesian. Gemini executes live operations using tool calling:
- `get_pond_telemetry`: Inspect real-time water quality metrics.
- `get_pond_diagnostic`: Retrieve biological health evaluations and anomaly logs.
- `adjust_aerator_vfd`: Directly calibrate aerator inverter frequency.
- `dispense_feed`: Trigger automated feed auger dispenser.
- `dose_molasses`: Inject organic carbon molasses solution.
- `purge_bottom_sludge`: Open bottom drain valve to remove anaerobic sludge.
- `adjust_daily_treatment`: Dynamically update scheduled daily treatment doses.
- `approve_all_treatments`: Supervisor approval of pending treatments.

### 5. 🎛️ ESP32 Multi-Node IoT Edge Simulator
- Simulates 4 edge microcontrollers (`sac/pond001` through `sac/pond004`).
- **One-Click Crisis Presets:**
  - *Optimal Biofloc:* Normal steady-state operation.
  - *Acute Hypoxia:* Drops DO to $2.8\text{ mg/L}$ to test emergency aeration response.
  - *Ammonia Spike:* Raises TAN to $0.75\text{ ppm}$ to test C:N molasses recommendation.
  - *Sludge Overload:* Raises floc volume to $32\text{ mL/L}$ to trigger siphon warnings.
- **Adjust Sensor Modal:** Allows fine-grained slider adjustments with lock protection against natural simulation drift.

---

## 💻 Prerequisites

Ensure your system meets the following requirements:
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MySQL Server**: 8.0 or higher (running on `127.0.0.1:3306`)
- **Git**: Installed on your system
- **Google Gemini API Key** (Optional): Available at [Google AI Studio](https://aistudio.google.com/). If omitted, SAC operates seamlessly using its built-in high-fidelity biological simulation engine.

---

## 📦 Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/ilfahidayat/SAC.git
cd SAC
```

### Step 2: Install All Dependencies
Install dependencies across the monorepo root and all three subprojects:

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
npm --prefix backend install

# 3. Install frontend dependencies
npm --prefix frontend install

# 4. Install simulator dependencies
npm --prefix simulator install
```

---

## 🗄️ Database Setup, Migrations & Seeding

SAC utilizes **MySQL 8.x** managed through **Knex.js** for schema versioning and data seeding.

### 1. Create the MySQL Database
Open your MySQL terminal or database GUI (e.g., MySQL Workbench, TablePlus, DBeaver) and create the database:

```sql
CREATE DATABASE sac_biofloc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Database Credentials
Ensure your `backend/.env` file has the correct database credentials:

```env
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=sac_biofloc
```

### 3. Run Database Migrations
Execute Knex migrations to create all required tables (`ponds`, `hardware_nodes`, `actuators`, `telemetry_logs`, `ai_analyses`, `ai_recommendations`, `execution_logs`, `mortality_logs`):

```bash
# Run migrations from root
npm --prefix backend run migrate

# Or directly within backend directory
cd backend && npm run migrate && cd ..
```

Output:
```text
Batch 1 run: 1 migrations
20261017_001_create_ponds_and_actuators.js
```

### 4. Seed the Database
Populate the database with initial standard biofloc ponds (Ponds 1 to 4), edge nodes, sensors, actuators, and today's treatment schedules:

```bash
# Run seeds from root
npm --prefix backend run seed

# Or directly within backend directory
cd backend && npm run seed && cd ..
```

Output:
```text
[Seed] Database successfully seeded with 4 Ponds, 16 Actuators, 48 6-Hour Telemetry Logs, AI Recommendations, Executions & Audit Trails.
Ran 1 seed files
```

### Database Management Commands

| Command | Working Directory | Description |
|---|---|---|
| `npm run migrate` | `backend/` | Applies all pending migrations up to latest version. |
| `npm run seed` | `backend/` | Populates database with fresh initial ponds, edge nodes, and treatments. |
| `npx knex migrate:rollback` | `backend/` | Rolls back the most recent migration batch. |
| `npx knex migrate:status` | `backend/` | Displays the status of all migration files. |

---

## ⚙️ Environment Configuration

Copy the example environment configuration to create your active backend `.env`:

```bash
cp backend/.env.example backend/.env
```

### Configuration Parameters in `backend/.env`

```env
# ==========================================
# Server Settings
# ==========================================
PORT=5050
NODE_ENV=development
CORS_ORIGIN=http://localhost:5175,http://localhost:5177

# ==========================================
# Database Configuration (MySQL 8.x + Knex)
# ==========================================
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=sac_biofloc

# ==========================================
# MQTT IoT Protocol Broker
# ==========================================
# Default: Public EMQX Cloud WebSocket broker
MQTT_BROKER_URL=wss://broker.emqx.io:8084/mqtt
MQTT_CLIENT_ID=sac-backend-server
MQTT_USERNAME=
MQTT_PASSWORD=

# ==========================================
# Google Gemini Generative AI
# ==========================================
# Set USE_MOCK_GEMINI=true for local simulation without API quota usage
# Set USE_MOCK_GEMINI=false for live Google AI Studio Generative API
USE_MOCK_GEMINI=false
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash

# ==========================================
# Cron Schedules
# ==========================================
# 07:00 AM Daily Morning Briefing & Avnimelech Biofloc Prescription
CRON_SCHEDULE_MORNING_BRIEFING=0 7 * * *
```

---

## 🚀 Running the Platform

### Method 1: Unified Single-Command Runner (Recommended)

Start the entire platform (**Backend**, **Frontend**, and **IoT Simulator**) concurrently with a single command from the project root:

```bash
npm run dev
```

Or execute the startup script:
```bash
chmod +x start.sh
./start.sh
```

The unified orchestrator (`scripts/dev-all.js`) will:
1. Verify the MySQL database and populate seed data.
2. Launch the **Backend Server** on [`http://localhost:5050`](http://localhost:5050).
3. Launch the **SAC Web Dashboard** on [`http://localhost:5175`](http://localhost:5175).
4. Launch the **ESP32 Edge Simulator** on [`http://localhost:5177`](http://localhost:5177).

---

### Method 2: Running Services Individually

To run services in separate terminal sessions for targeted debugging:

#### Terminal 1: Backend Server (Port 5050)
```bash
cd backend
npm run dev
```

#### Terminal 2: SAC Frontend Dashboard (Port 5175)
```bash
cd frontend
npm run dev
```

#### Terminal 3: ESP32 IoT Edge Simulator (Port 5177)
```bash
cd simulator
npm run dev
```

---

## 📖 Feature Walkthrough & Usage Guide

### 1. Navigating the Frontend Dashboard (`http://localhost:5175`)

- **Pond Overview (`/`)**:
  - View real-time biological health scores, biomass statistics, daily feed totals, and active culture cycle indicators for all 4 ponds (Pond 1 to Pond 4).
  - Inspect AI biological synthesis summaries explaining current microbial status and recommending proactive key actions.
- **Water Quality Telemetry (`/telemetry`)**:
  - Interactive radial gauges for DO, pH, Temperature, TAN Ammonia, and Imhoff Floc.
  - Time-series charts visualizing biometric trends over 24-hour cycles.
  - Imhoff cone floc sedimentation tracker.
- **Daily Treatment Hub (`/daily-treatment`)**:
  - Review today's 4-pillar chronological biofloc treatments.
  - Filter by pond (`ALL PONDS`, `K01`, `K02`, `K03`, `K04`) or treatment category (`Feeding`, `Molasses`, `Sludge Siphon`, `Aerator Speed`).
  - Click **Approve** on pending treatments, or click **Run Now** to immediately dispatch instructions to IoT actuators.
  - Click **Adjust** to modify target dosage or scheduled execution timestamps.
  - Click **+ Manual Treatment** to insert custom operational tasks.
  - Click **Reset Clean Data** to restore clean initial schedules.
- **Equipment & Sensors (`/hardware`)**:
  - Symmetrical bilateral hardware cards displaying the status of 4 primary ESP32 edge gateways.
  - Left column: 5 RS485 telemetry probe sensors (DO, pH, Temp, TAN, Floc).
  - Right column: 5 physical actuator devices (VFD Inverter, Auto-Feeder, Molasses Pump, Siphon Valve, Edge Gateway).
  - Power toggle switch to simulate edge node disconnection or power outage.
- **Gemini Co-Pilot Chat (`/copilot` or Top-Right Drawer)**:
  - Farm supervisors can query the AI naturally in English or Indonesian.
  - Example commands:
    - `"What is the condition of Pond 1?"` / `"Kondisi kolam 1 gimana?"`
    - `"Increase evening feed for Pond 1 to 15 kg"` / `"Ubah pakan sore kolam 1 jadi 15 kg"`
    - `"Set Pond 2 aerator to 90% power"` / `"Atur aerator kolam 2 ke 90%"`
    - `"Execute morning feeding now"` / `"Jalankan pakan pagi sekarang"`
    - `"Approve all treatments for today"` / `"Setujui semua jadwal hari ini"`
  - Gemini executes the requested action using Function Calling and returns structured confirmation action cards with zero hallucinations.

---

### 2. Using the ESP32 IoT Edge Simulator (`http://localhost:5177`)

- **Independent Multi-Node Grid:** Displays nodes for Pond 1 (`sac/pond001`) through Pond 4 (`sac/pond004`).
- **Adjusting Parameters:**
  - Click on any parameter metric tile (e.g., DO, TAN, Floc) to open the **Adjust Sensor Modal**.
  - Drag the range slider or enter exact numerical values.
  - Check **Lock Sensor Settings** to prevent natural biological drift from changing values.
- **Crisis Presets (Testing Closed-Loop AI Safety):**
  - Click **DANGER** or open **TUNE** and select **Acute Hypoxia**: Dissolved Oxygen drops to $2.8\text{ mg/L}$.
  - Observe how the backend AI Guard instantly detects hypoxia and automatically fires an MQTT command overriding the aerator VFD to 100% full speed.
  - Select **Ammonia Spike**: TAN spikes to $0.75\text{ ppm}$, triggering the Avnimelech equation to prescribe cane molasses dosing.
  - Select **Sludge Overload**: Floc density spikes to $32\text{ mL/L}$, prompting the AI to request a bottom sludge siphon purge.

---

### 3. Dynamic System Configuration Modal

Click the **Gear / Settings** icon in the dashboard sidebar or top bar to access the live configuration modal:
- **Operation Mode:** Hot-swap between **Live Google GenAI API** and **Mock Simulation Mode** without restarting servers.
- **Model Selection:** Choose between `gemini-3.8-flash`, `gemini-2.5-flash`, or custom models.
- **API Key Management:** Save your Google AI Studio API key directly into `backend/.env`.
- **MQTT Reconnect:** Switch broker addresses or ports on the fly.

---

## 📡 MQTT IoT Protocol Specification

SAC adheres to a clean MQTT topic structure over WebSockets (`wss://broker.emqx.io:8084/mqtt`):

| Topic Pattern | Direction | Purpose | Payload Example |
|---|---|---|---|
| `sac/+/telemetry` | Simulator $\rightarrow$ Backend/UI | Inbound biometric probe telemetry packet from ESP32 | `{"sensors": {"do": 5.8, "ph": 7.4, "temp": 28.5, "ammonia": 0.02, "flocDensity": 14.0}}` |
| `sac/+/commands` | Backend/UI $\rightarrow$ Simulator | Actuator control instructions | `{"action": "aerator", "params": {"power_percent": 90, "rpm": 1350}}` |
| `sac/+/events` | Simulator $\rightarrow$ Backend/UI | Physical actuator confirmation and telemetry response | `{"event": "FEEDING_COMPLETE", "dose": 11.2, "unit": "kg"}` |
| `sac/+/copilot` | Backend $\rightarrow$ UI | Diagnostic analysis broadcasts & action cards | `{"message_type": "DIAGNOSTIC", "text": "...", "actionCard": {...}}` |
| `sac/+/executions`| Backend $\rightarrow$ UI | Reactive updates when daily treatments change | `{"type": "TASK_UPDATED", "execution": {...}}` |
| `sac/+/processed` | Backend $\rightarrow$ UI | Broadcast of updated health score and status | `{"pondId": "K01", "healthScore": 96, "status": "OPTIMAL"}` |

---

## 🔌 REST API Reference

The backend exposes RESTful endpoints at `http://localhost:5050/api`:

### Pond & Telemetry Endpoints
- `GET /api/ponds` — List all ponds with cached biometric telemetry and cycle status.
- `GET /api/ponds/:id` — Retrieve detailed statistics for a specific pond.
- `GET /api/ponds/:id/telemetry/latest` — Get latest sensor readings.
- `GET /api/ponds/:id/telemetry/history?limit=250` — Historical telemetry timeseries.
- `GET /api/ponds/:id/ai/latest` — Latest Gemini generative biological evaluation.

### Daily Treatment & Actuator Endpoints
- `GET /api/executions/:pondId` — Retrieve today's scheduled and completed treatments.
- `POST /api/executions` — Create a new manual biofloc treatment.
- `PUT /api/executions/:id` — Adjust dosage or scheduled execution time.
- `POST /api/executions/:id/run-now` — Immediately dispatch treatment to IoT actuator.
- `POST /api/executions/command` — Direct actuator command dispatch (feed, molasses, aerator, siphon).

### Gemini Co-Pilot Endpoints
- `POST /api/copilot/chat` — Send conversational messages to Gemini with Function Calling execution.
- `POST /api/copilot/action/:actionId/approve` — Approve an action card recommended by Co-Pilot.

### System Configuration Endpoints
- `GET /api/system/health` — Service health check and database status.
- `GET /api/system/config` — Current active AI and MQTT broker settings.
- `POST /api/system/config/ai` — Update Gemini API key and active model.
- `POST /api/system/config/mqtt` — Reconnect backend to custom MQTT broker.
- `POST /api/system/reset-db` — Reset database to clean initial state via Knex seed.

---

## 🛠️ Troubleshooting & FAQ

### 1. MySQL Connection Error (`ECONNREFUSED 127.0.0.1:3306`)
- **Cause:** MySQL server is not running or the port is blocked.
- **Solution:** 
  - macOS: `brew services start mysql`
  - Linux: `sudo systemctl start mysql`
  - Windows: Start MySQL service in Windows Services (`services.msc`).
  - Verify credentials in `backend/.env` match your local MySQL root password.

### 2. Database Migration Error (`ER_BAD_DB_ERROR: Unknown database 'sac_biofloc'`)
- **Cause:** The database was not created prior to running migrations.
- **Solution:** Connect to MySQL (`mysql -u root -p`) and run:
  ```sql
  CREATE DATABASE sac_biofloc;
  ```
  Then re-run `npm --prefix backend run migrate` and `npm --prefix backend run seed`.

### 3. Gemini API Rate Limits or Network Restrictions
- **Cause:** API quota exhausted or firewall blocking `generativelanguage.googleapis.com`.
- **Solution:** In the SAC Dashboard, click the **Settings** icon and toggle **Operation Mode** to **Mock Simulation Mode**, or set `USE_MOCK_GEMINI=true` in `backend/.env`. The platform will run all features smoothly without external network latency.

### 4. MQTT Telemetry Disconnection
- **Cause:** Public broker `broker.emqx.io` experiencing temporary downtime or network firewall blocking port 8084.
- **Solution:** Open the **Settings** modal in either the Frontend Dashboard or Simulator and point the broker to an alternative broker (e.g., `wss://test.mosquitto.org:8081/mqtt`).

---

## 📄 License

This project is open-source and licensed under the **[MIT License](LICENSE)**. Feel free to use, enhance, and distribute for academic, research, and commercial smart aquaculture applications.

---

<div align="center">
  <b>Built for the Google Cloud AI Cup 2026</b><br>
  <i>Empowering Sustainable Biofloc Aquaculture with Autonomous Artificial Intelligence</i>
</div>
