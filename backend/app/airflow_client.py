"""Minimal Airflow REST client: trigger the nebula_flow_runner DAG.

Best-effort — when Airflow is unreachable the caller falls back to local execution,
so the product works with or without Airflow running.
"""
from typing import Optional

import requests

from .config import settings

DAG_ID = "nebula_flow_runner"


def trigger_dag(flow_id: int, customer_id: Optional[int] = None) -> Optional[str]:
    base = (settings.AIRFLOW_BASE_URL or "").rstrip("/")
    if not base:
        return None
    try:
        resp = requests.post(
            f"{base}/api/v1/dags/{DAG_ID}/dagRuns",
            json={"conf": {"flow_id": flow_id, "customer_id": customer_id}},
            auth=(settings.AIRFLOW_USERNAME, settings.AIRFLOW_PASSWORD),
            timeout=3,
        )
        if resp.status_code in (200, 201):
            return resp.json().get("dag_run_id")
    except Exception:
        return None
    return None
