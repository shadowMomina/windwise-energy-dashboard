
import json
import urllib.request
from urllib.parse import urlencode
from datetime import date, timedelta
from pathlib import Path

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)


def fetch(url, params):
    request_url = f"{url}?{urlencode(params)}"
    request = urllib.request.Request(
        request_url,
        headers={"Accept": "application/json"}
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def download_actuals():
    records = []

    current = date(2026, 1, 1)
    end = date(2026, 2, 1)

    while current < end:
        day = current.isoformat()
        print(f"Downloading actual generation: {day}")

        result = fetch(
            f"{BASE_URL}/datasets/FUELHH/stream",
            {
                "settlementDateFrom": day,
                "settlementDateTo": day,
            },
        )

        records.extend(
            row for row in result
            if row.get("fuelType") == "WIND"
        )

        current += timedelta(days=1)

    output = DATA_DIR / "wind_actuals_jan2026.json"
    output.write_text(json.dumps(records, indent=2), encoding="utf-8")
    print(f"Saved {len(records)} actual records to {output}")


def download_forecasts():
    records = []

    current = date(2026, 1, 1)
    end = date(2026, 2, 1)

    while current < end:
        publish_time = f"{current.isoformat()}T12:00:00Z"
        print(f"Downloading forecast snapshot: {publish_time}")

        result = fetch(
            f"{BASE_URL}/forecast/generation/wind/history",
            {"publishTime": publish_time},
        )

        records.extend(result.get("data", []))
        current += timedelta(days=1)

    # Remove duplicate records, if any.
    unique = {
        (
            row.get("publishTime"),
            row.get("startTime"),
            row.get("generation"),
        ): row
        for row in records
    }

    output = DATA_DIR / "wind_forecasts_jan2026.json"
    output.write_text(
        json.dumps(list(unique.values()), indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(unique)} forecast records to {output}")


if __name__ == "__main__":
    download_actuals()
    download_forecasts()
    print("Data download complete!")

