<div align="center">

# 🌬️ WINDWISE

### UK Wind Generation Forecast Intelligence

**Are wind generation forecasts matching reality?**

An interactive analytics dashboard comparing forecasted and actual UK wind power generation throughout January 2026.

<br>

**React** · **FastAPI** · **Python** · **Docker** · **Elexon BMRS**

</div>

---

## ⚡ Overview

Windwise helps explore the gap between predicted and actual wind generation. It transforms electricity-system data into an interactive dashboard, making forecast performance easier to understand through time-series visualisations and statistical metrics.

The project covers **January 1–31, 2026**, with **744 hourly evaluation periods**.

## ✨ Features

| Feature                  | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| 📊 Generation comparison | Explore forecasted and actual wind generation over time.     |
| 🎯 Forecast accuracy     | Evaluate performance using MAE, RMSE, and forecast bias.     |
| 📅 Daily analysis        | Examine changes in generation patterns throughout the month. |
| 🔎 Date filtering        | Focus on a selected period within January 2026.              |
| ⚙️ REST API              | Retrieve analysis results through a FastAPI backend.         |
| 🐳 Docker support        | Run the frontend and backend using Docker Compose.           |

## 🧰 Technology Stack

**Frontend**

* React
* Vite
* Recharts
* Lucide React

**Backend**

* Python
* FastAPI
* Uvicorn

**Quality & Deployment**

* Pytest
* Docker
* Docker Compose

## 📈 Evaluation Summary

The current evaluation covers all 744 hourly periods in January 2026.

| Metric                         |       Result |
| ------------------------------ | -----------: |
| Mean Absolute Error (MAE)      |  1,886.48 MW |
| Root Mean Squared Error (RMSE) |  2,365.68 MW |
| Mean Forecast Bias             | +1,690.32 MW |
| Mean Actual Generation         | 11,580.74 MW |
| Mean Forecast Generation       | 13,271.06 MW |
| Hours Evaluated                |          744 |

**Interpretation:** The positive bias indicates that forecasts were higher than actual generation on average under the project's forecast-minus-actual convention.

These metrics describe this particular dataset and evaluation method; they should not be interpreted as a general measure of forecast performance for other periods.

## 🗂️ Data & Methodology

Windwise uses data from the official Elexon BMRS API.

* [Actual generation — FUELHH](https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream)
* [Historical wind generation forecasts](https://data.elexon.co.uk/bmrs/api/v1/forecast/generation/wind/history)

### Processing approach

1. Load actual wind generation records for January 2026.
2. Load historical wind forecast snapshots surrounding the evaluation period.
3. Aggregate the two half-hourly actual measurements into an hourly value.
4. Select a forecast snapshot published before the relevant delivery hour.
5. Align forecast and actual values by delivery hour.
6. Calculate forecast accuracy metrics.

### Metrics explained

* **MAE:** Average absolute difference between forecast and actual generation.
* **RMSE:** Square root of the mean squared error; larger errors have greater influence.
* **Bias:** Mean of forecast minus actual generation. Positive values indicate overforecasting.

The results depend on the selected forecast snapshots, publication-time rules, and data availability.

## 🏗️ Architecture

```text
             ┌─────────────────────────┐
             │      React + Vite       │
             │   Interactive Dashboard│
             └────────────┬────────────┘
                          │ HTTP requests
                          ▼
             ┌─────────────────────────┐
             │      FastAPI Backend    │
             │  Analysis & REST API    │
             └────────────┬────────────┘
                          │
                          ▼
             ┌─────────────────────────┐
             │    Local JSON Data      │
             │ Actuals + Forecasts     │
             └─────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

* Python 3.12 or a compatible Python version
* Node.js and npm
* Docker Desktop, if using Docker

### 1. Clone the repository

```bash
git clone https://github.com/shadowMomina/windwise-energy-dashboard.git
cd windwise-energy-dashboard
```

### 2. Start the backend

From the project root:

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn main:app --app-dir backend --reload
```

Backend: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Start the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local address printed by Vite.

By default, the frontend uses `http://127.0.0.1:8000` for its API. Set `VITE_API_URL` when connecting it to another backend.

### 🐳 Run with Docker

From the repository root:

```bash
docker compose up --build
```

* Dashboard: `http://localhost:5173`
* API: `http://localhost:8000`
* API documentation: `http://localhost:8000/docs`

Stop the containers:

```bash
docker compose down
```

## 🧪 Tests

Run the test suite from the project root:

```bash
python -m pip install pytest httpx
python -m pytest tests -v
```

## 📁 Project Structure

```text
energy-forecast-dashboard/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
├── data/
│   ├── wind_actuals_jan2026.json
│   └── wind_forecasts_jan2026.json
├── tests/
│   └── test_api.py
├── download_data.py
├── docker-compose.yml
├── .dockerignore
├── .gitignore
└── README.md
```

## ⚠️ Limitations

* The analysis is limited to January 2026.
* Hourly aggregation removes variation within half-hourly intervals.
* Results depend on the forecast publication snapshots selected for comparison.
* Forecast accuracy can vary by season and weather conditions.
* Historical performance does not guarantee future forecast accuracy.


## 🔗 Project Links

* **Repository:** [Windwise on GitHub](https://github.com/shadowMomina/windwise-energy-dashboard)
* **Live Dashboard:** (https://windwise-energy-dashboard.vercel.app/)
* **Demo Video:** *https://www.loom.com/share/d6c69999a78e4cf6874eefff80c50090*

---

<div align="center">

**WINDWISE** · Making wind forecast performance easier to explore. 🌬️

</div>
