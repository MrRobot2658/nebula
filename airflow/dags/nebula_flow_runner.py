"""Airflow DAG: execute a Nebula automation flow.

Triggered (via REST) with conf {flow_id, customer_id?}. It calls back into the
Nebula backend's flow engine (/api/flows/{id}/_execute), so Airflow orchestrates
the run while the engine performs the work. Trigger from Nebula's
POST /api/flows/{id}/run, or manually from the Airflow UI with a conf JSON.
"""
import os
from datetime import datetime

import requests
from airflow import DAG
from airflow.operators.python import PythonOperator

NEBULA_API = os.getenv("NEBULA_API_BASE", "http://backend:8000")


def execute_flow(**context):
    dag_run = context.get("dag_run")
    conf = (dag_run.conf or {}) if dag_run else {}
    flow_id = conf.get("flow_id")
    customer_id = conf.get("customer_id")
    if not flow_id:
        print("nebula_flow_runner: no flow_id in conf; nothing to do")
        return
    resp = requests.post(
        f"{NEBULA_API}/api/flows/{flow_id}/_execute",
        json={"customer_id": customer_id},
        timeout=30,
    )
    print(f"nebula_flow_runner: flow={flow_id} -> {resp.status_code} {resp.text[:400]}")
    resp.raise_for_status()


with DAG(
    dag_id="nebula_flow_runner",
    schedule=None,
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["nebula"],
) as dag:
    PythonOperator(task_id="execute_flow", python_callable=execute_flow)
