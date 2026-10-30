\# Windwise — UK Wind Generation Forecast Dashboard



Windwise is a web dashboard for comparing forecasted and actual UK wind power generation during January 2026. It presents forecast performance through interactive visualisations and statistical error metrics.



\## Features



\* Compare forecast and actual wind generation.

\* View forecast performance over time.

\* Explore daily generation patterns.

\* Filter results by date.

\* Review forecast accuracy using MAE, RMSE, and bias.

\* Access data through a Python REST API.

\* Run the application locally or with Docker Compose.



\## Technology Stack



\*\*Frontend\*\*



\* React

\* Vite

\* Recharts

\* Lucide React



\*\*Backend\*\*



\* Python

\* FastAPI

\* Uvicorn



\*\*Testing and Deployment\*\*



\* Pytest

\* Docker

\* Docker Compose



\## Data Source



Windwise uses UK electricity system data from the official Elexon BMRS API:



\* Actual generation: \[Elexon BMRS API](https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream)

\* Historical wind generation forecasts: \[Elexon wind forecast API](https://data.elexon.co.uk/bmrs/api/v1/forecast/generation/wind/history)



The dataset covers 1–31 January 2026.



\## Methodology



Actual wind generation is reported at half-hourly settlement intervals. For hourly comparisons, the two half-hourly actual generation measurements within each hour are averaged.



Forecasts are selected using their publication timestamps, so the comparison uses a forecast published before the relevant delivery hour. The backend then aligns the hourly forecasts with the hourly actual generation values.



The dashboard calculates:



\* \*\*MAE (Mean Absolute Error):\*\* Average absolute difference between forecast and actual generation.

\* \*\*RMSE (Root Mean Squared Error):\*\* Error metric that gives greater weight to larger errors.

\* \*\*Bias:\*\* Average signed forecast error, calculated as forecast minus actual. Positive bias indicates overforecasting.



The analysis evaluates 744 hourly periods across January 2026.



\## API Endpoints



| Endpoint        | Description                                                  |

| --------------- | ------------------------------------------------------------ |

| `/`             | API status                                                   |

| `/api/overview` | Summary metrics and evaluation statistics                    |

| `/api/forecast` | Forecast and actual generation comparison, with date filters |

| `/api/daily`    | Daily generation summaries                                   |



\## Run Locally



\### Requirements



\* Python 3.12 or compatible version

\* Node.js and npm



\### 1. Start the backend



From the project root:



```bash

python -m pip install -r backend/requirements.txt

python -m uvicorn main:app --app-dir backend --reload

```



The API will be available at `http://127.0.0.1:8000`.



Interactive API documentation is available at `http://127.0.0.1:8000/docs`.



\### 2. Start the frontend



Open a second terminal:



```bash

cd frontend

npm install

npm run dev

```



Open the local URL printed by Vite in your terminal.



By default, the frontend expects the API at `http://127.0.0.1:8000`. To use a different API URL, configure the `VITE\_API\_URL` environment variable.



\## Run with Docker



From the project root:



```bash

docker compose up --build

```



The application services are exposed at:



\* Frontend: `http://localhost:5173`

\* Backend: `http://localhost:8000`

\* API documentation: `http://localhost:8000/docs`



Stop the containers with:



```bash

docker compose down

```



\## Run Tests



From the project root:



```bash

python -m pip install pytest httpx

python -m pytest tests -v

```



\## Project Structure



```text

energy-forecast-dashboard/

├── backend/

├── frontend/

├── data/

├── tests/

├── docker-compose.yml

├── .dockerignore

├── .gitignore

└── README.md

```



\## Limitations



\* Results depend on the completeness and availability of the source data.

\* Forecast accuracy depends on the forecast publication snapshots selected for evaluation.

\* Hourly averaging removes some variation present in half-hourly generation.

\* Results describe the selected January 2026 period and should not automatically be generalised to other months.



\## AI Assistance



AI tools were used to assist with development, debugging, documentation, and problem-solving. The data source, processing approach, implementation, and evaluation should be reviewed and understood by the project author.



\## Links



\* \*\*GitHub repository:\*\* Add the repository URL after publishing.

\* \*\*Live dashboard:\*\* Add the deployment URL after deployment.

\* \*\*Demo video:\*\* Add the unlisted YouTube URL after recording.



