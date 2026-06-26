from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..airflow_client import trigger_dag
from ..database import get_db
from ..flow_engine import execute_flow
from ..models import AbAssignment, Flow, FlowRun
from ..schemas import (
    AbResult,
    FlowCreate,
    FlowOut,
    FlowPatch,
    FlowRunOut,
    FlowRunRequest,
)

router = APIRouter(tags=["flows"])


@router.get("/flows", response_model=list[FlowOut], summary="流程列表")
def list_flows(db: Session = Depends(get_db)):
    return db.query(Flow).order_by(Flow.id.desc()).all()


@router.post("/flows", response_model=FlowOut, status_code=201, summary="新建流程")
def create_flow(payload: FlowCreate, db: Session = Depends(get_db)):
    flow = Flow(
        name=payload.name,
        status="draft",
        nodes=[n.model_dump() for n in payload.nodes],
        edges=[e.model_dump() for e in payload.edges],
    )
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return flow


@router.get("/flows/{flow_id}", response_model=FlowOut, summary="流程详情")
def get_flow(flow_id: int, db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "flow not found")
    return flow


@router.patch("/flows/{flow_id}", response_model=FlowOut, summary="保存流程（画布）")
def patch_flow(flow_id: int, payload: FlowPatch, db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "flow not found")
    if payload.name is not None:
        flow.name = payload.name
    if payload.status is not None:
        flow.status = payload.status
    if payload.nodes is not None:
        flow.nodes = [n.model_dump() for n in payload.nodes]
    if payload.edges is not None:
        flow.edges = [e.model_dump() for e in payload.edges]
    db.commit()
    db.refresh(flow)
    return flow


def _run(db: Session, flow: Flow, customer_id, executor: str, dag_run_id=None) -> FlowRun:
    log, _ = execute_flow(db, flow, customer_id)
    run = FlowRun(flow_id=flow.id, executor=executor, status="success", dag_run_id=dag_run_id, log=log)
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.post("/flows/{flow_id}/run", response_model=FlowRunOut, summary="运行流程（Airflow，失败回退本地）")
def run_flow(flow_id: int, payload: FlowRunRequest = FlowRunRequest(), db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "flow not found")
    # Best-effort trigger an Airflow DAG run; either way we execute the engine now so
    # the response carries an authoritative log (works with or without Airflow up).
    dag_run_id = trigger_dag(flow_id, payload.customer_id)
    executor = "airflow" if dag_run_id else "local"
    return _run(db, flow, payload.customer_id, executor, dag_run_id)


@router.post("/flows/{flow_id}/_execute", response_model=FlowRunOut, summary="执行流程引擎（供 Airflow DAG 回调）")
def execute(flow_id: int, payload: FlowRunRequest = FlowRunRequest(), db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "flow not found")
    return _run(db, flow, payload.customer_id, "airflow")


@router.get("/flows/{flow_id}/runs", response_model=list[FlowRunOut], summary="运行记录")
def list_runs(flow_id: int, db: Session = Depends(get_db)):
    return db.query(FlowRun).filter(FlowRun.flow_id == flow_id).order_by(FlowRun.id.desc()).limit(50).all()


@router.get("/flows/{flow_id}/abtest-results", response_model=list[AbResult], summary="AB 测试结果")
def abtest_results(flow_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(AbAssignment.variant, func.count(AbAssignment.id))
        .filter(AbAssignment.flow_id == flow_id)
        .group_by(AbAssignment.variant)
        .all()
    )
    return [AbResult(variant=v, count=c) for v, c in rows]
