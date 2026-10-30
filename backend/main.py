import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

app = FastAPI(
    title="UK Wind Forecast Analytics API",
    description="UK wind generation forecast accuracy for January 2026",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

JAN_START = datetime(2026, 1, 1, tzinfo=timezone.utc)
FEB_START = datetime(2026, 2, 1, tzinfo=timezone.utc)


def parse_time(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def load_json(filename):
    path = DATA_DIR / filename

    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")

    with path.open(encoding="utf-8") as file:
        return json.load(file)


def prepare_data():
    actuals = load_json("wind_actuals_jan2026.json")
    forecasts = load_json("wind_forecasts_jan2026.json")

    # Aggregate half-hourly actual generation into hourly averages.
    actual_groups = defaultdict(list)

    for row in actuals:
        start = parse_time(row["startTime"])

        if JAN_START <= start < FEB_START:
            hour = start.replace(minute=0, second=0, microsecond=0)
            actual_groups[hour].append(float(row["generation"]))

    hourly_actuals = {}

    for hour, values in actual_groups.items():
        # Do not score incomplete hours.
        if len(values) == 2:
            hourly_actuals[hour] = sum(values) / len(values)

    # Keep only January delivery forecasts.
    forecast_groups = defaultdict(list)

    for row in forecasts:
        start = parse_time(row["startTime"])
        published = parse_time(row["publishTime"])

        if not JAN_START <= start < FEB_START:
            continue

        # Never use a forecast published after delivery began.
        if published > start:
            continue

        hour = start.replace(minute=0, second=0, microsecond=0)

        forecast_groups[hour].append({
            "forecast_mw": float(row["generation"]),
            "published_at": published,
        })

    records = []

    for hour, actual_mw in hourly_actuals.items():
        candidates = forecast_groups.get(hour, [])

        if not candidates:
            continue

        # Latest forecast available before the delivery hour.
        chosen = max(candidates, key=lambda item: item["published_at"])
        forecast_mw = chosen["forecast_mw"]
        error = forecast_mw - actual_mw

        records.append({
            "time": hour,
            "actual_mw": round(actual_mw, 2),
            "forecast_mw": round(forecast_mw, 2),
            "error_mw": round(error, 2),
            "absolute_error_mw": abs(error),
            "squared_error": error ** 2,
            "published_at": chosen["published_at"],
        })

    records.sort(key=lambda row: row["time"])
    return records


def calculate_metrics(records):
    if not records:
        return {
            "periods_evaluated": 0,
            "mae_mw": None,
            "rmse_mw": None,
            "bias_mw": None,
            "mean_actual_mw": None,
            "mean_forecast_mw": None,
        }

    count = len(records)

    return {
        "periods_evaluated": count,
        "mae_mw": round(
            sum(r["absolute_error_mw"] for r in records) / count, 2
        ),
        "rmse_mw": round(
            math.sqrt(sum(r["squared_error"] for r in records) / count), 2
        ),
        "bias_mw": round(
            sum(r["error_mw"] for r in records) / count, 2
        ),
        "mean_actual_mw": round(
            sum(r["actual_mw"] for r in records) / count, 2
        ),
        "mean_forecast_mw": round(
            sum(r["forecast_mw"] for r in records) / count, 2
        ),
    }


@app.get("/")
def root():
    return {
        "message": "UK Wind Forecast Analytics API",
        "docs": "/docs",
        "endpoints": [
            "/api/overview",
            "/api/forecast",
            "/api/daily",
        ],
    }


@app.get("/api/overview")
def overview():
    try:
        records = prepare_data()

        return {
            "period": "January 2026",
            "timezone": "UTC",
            "units": "MW",
            "metrics": calculate_metrics(records),
            "coverage": {
                "hours_evaluated": len(records),
                "hours_in_january": 744,
                "first_hour": (
                    records[0]["time"].isoformat() if records else None
                ),
                "last_hour": (
                    records[-1]["time"].isoformat() if records else None
                ),
            },
            "methodology": (
                "Half-hourly actual generation is averaged by hour. "
                "The latest forecast published before each delivery hour "
                "is selected. Only complete actual hours with an eligible "
                "forecast are evaluated."
            ),
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/api/forecast")
def forecast_data(
    start: str = Query("2026-01-01"),
    end: str = Query("2026-02-01"),
):
    try:
        start_date = parse_time(start + "T00:00:00+00:00") if len(start) == 10 else parse_time(start)
        end_date = parse_time(end + "T00:00:00+00:00") if len(end) == 10 else parse_time(end)

        if start_date >= end_date:
            raise HTTPException(
                status_code=400,
                detail="'start' must be earlier than 'end'.",
            )

        records = [
            row for row in prepare_data()
            if start_date <= row["time"] < end_date
        ]

        return {
            "count": len(records),
            "data": [
                {
                    "time": row["time"].isoformat(),
                    "actual_mw": row["actual_mw"],
                    "forecast_mw": row["forecast_mw"],
                    "error_mw": row["error_mw"],
                    "published_at": row["published_at"].isoformat(),
                }
                for row in records
            ],
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.get("/api/daily")
def daily_data():
    try:
        groups = defaultdict(list)

        for row in prepare_data():
            groups[row["time"].strftime("%Y-%m-%d")].append(row)

        daily = []

        for day, rows in sorted(groups.items()):
            count = len(rows)

            daily.append({
                "date": day,
                "actual_mw": round(
                    sum(r["actual_mw"] for r in rows) / count, 2
                ),
                "forecast_mw": round(
                    sum(r["forecast_mw"] for r in rows) / count, 2
                ),
                "mae_mw": round(
                    sum(r["absolute_error_mw"] for r in rows) / count, 2
                ),
                "bias_mw": round(
                    sum(r["error_mw"] for r in rows) / count, 2
                ),
                "hours": count,
            })

        return {"data": daily}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))