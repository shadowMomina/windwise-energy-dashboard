
import sys
from pathlib import Path

from fastapi.testclient import TestClient

# Make the backend module importable during testing.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from main import app, calculate_metrics  # noqa: E402

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "UK Wind Forecast Analytics API"


def test_overview_contains_valid_metrics():
    response = client.get("/api/overview")

    assert response.status_code == 200

    result = response.json()
    metrics = result["metrics"]

    assert result["period"] == "January 2026"
    assert result["units"] == "MW"
    assert metrics["periods_evaluated"] > 0
    assert metrics["mae_mw"] >= 0
    assert metrics["rmse_mw"] >= 0
    assert metrics["mean_actual_mw"] > 0
    assert metrics["mean_forecast_mw"] > 0


def test_forecast_endpoint_returns_data():
    response = client.get("/api/forecast")

    assert response.status_code == 200

    result = response.json()

    assert result["count"] > 0
    assert len(result["data"]) == result["count"]

    first_record = result["data"][0]

    assert "time" in first_record
    assert "actual_mw" in first_record
    assert "forecast_mw" in first_record
    assert "error_mw" in first_record


def test_forecast_date_filter():
    response = client.get(
        "/api/forecast",
        params={
            "start": "2026-01-01",
            "end": "2026-01-03",
        },
    )

    assert response.status_code == 200

    result = response.json()

    assert result["count"] > 0

    for record in result["data"]:
        assert record["time"][:10] in {
            "2026-01-01",
            "2026-01-02",
        }


def test_invalid_date_range_is_rejected():
    response = client.get(
        "/api/forecast",
        params={
            "start": "2026-01-10",
            "end": "2026-01-01",
        },
    )

    assert response.status_code == 400


def test_daily_endpoint_returns_daily_summaries():
    response = client.get("/api/daily")

    assert response.status_code == 200

    days = response.json()["data"]

    assert len(days) == 31

    for day in days:
        assert day["hours"] > 0
        assert day["mae_mw"] >= 0
        assert "actual_mw" in day
        assert "forecast_mw" in day


def test_metrics_calculation():
    records = [
        {
            "actual_mw": 100.0,
            "forecast_mw": 110.0,
            "error_mw": 10.0,
            "absolute_error_mw": 10.0,
            "squared_error": 100.0,
        },
        {
            "actual_mw": 200.0,
            "forecast_mw": 180.0,
            "error_mw": -20.0,
            "absolute_error_mw": 20.0,
            "squared_error": 400.0,
        },
    ]

    metrics = calculate_metrics(records)

    assert metrics["periods_evaluated"] == 2
    assert metrics["mae_mw"] == 15.0
    assert metrics["rmse_mw"] == round((250.0) ** 0.5, 2)
    assert metrics["bias_mw"] == -5.0


def test_empty_metrics():
    metrics = calculate_metrics([])

    assert metrics["periods_evaluated"] == 0
    assert metrics["mae_mw"] is None
    assert metrics["rmse_mw"] is None
    assert metrics["bias_mw"] is None

