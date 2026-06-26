"""Settings / admin endpoints: Skills, MCP servers, Memory, Tenants, Roles, Token usage.

The product's feature modules are surfaced here as built-in Skills.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Event, McpServer, Memory, Skill, Tenant
from ..schemas import (
    EnabledPatch,
    McpServerOut,
    MemoryCreate,
    MemoryOut,
    RoleOut,
    SkillOut,
    TenantOut,
    TokenUsageOut,
    TokenUsagePoint,
)

router = APIRouter(tags=["settings"])

# Static role/permission matrix.
ROLES = [
    {"key": "admin", "name": "管理员", "description": "全部权限", "permissions": ["*"]},
    {"key": "operator", "name": "运营", "description": "渠道 / 内容 / 活动 / 客户 / 会员", "permissions": ["channels", "content", "activity", "customers", "members"]},
    {"key": "analyst", "name": "分析师", "description": "看板与分析（只读）", "permissions": ["dashboard:read", "events:read"]},
    {"key": "guest", "name": "访客", "description": "只读", "permissions": ["*:read"]},
]


# ---------- Skills ----------
@router.get("/skills", response_model=list[SkillOut], summary="内置 Skills 列表")
def list_skills(db: Session = Depends(get_db)):
    return db.query(Skill).order_by(Skill.id).all()


@router.patch("/skills/{skill_id}", response_model=SkillOut, summary="启用/停用 Skill")
def patch_skill(skill_id: int, payload: EnabledPatch, db: Session = Depends(get_db)):
    skill = db.get(Skill, skill_id)
    if not skill:
        raise HTTPException(404, "skill not found")
    skill.enabled = payload.enabled
    db.commit()
    db.refresh(skill)
    return skill


# ---------- MCP servers ----------
@router.get("/mcp-servers", response_model=list[McpServerOut], summary="MCP 服务器列表")
def list_mcp(db: Session = Depends(get_db)):
    return db.query(McpServer).order_by(McpServer.id).all()


@router.patch("/mcp-servers/{server_id}", response_model=McpServerOut, summary="启用/停用 MCP 服务器")
def patch_mcp(server_id: int, payload: EnabledPatch, db: Session = Depends(get_db)):
    server = db.get(McpServer, server_id)
    if not server:
        raise HTTPException(404, "mcp server not found")
    server.enabled = payload.enabled
    server.status = "connected" if payload.enabled else "disconnected"
    db.commit()
    db.refresh(server)
    return server


# ---------- Memory ----------
@router.get("/memories", response_model=list[MemoryOut], summary="记忆列表")
def list_memories(db: Session = Depends(get_db)):
    return db.query(Memory).order_by(Memory.id.desc()).all()


@router.post("/memories", response_model=MemoryOut, status_code=201, summary="新增记忆")
def create_memory(payload: MemoryCreate, db: Session = Depends(get_db)):
    mem = Memory(scope=payload.scope, title=payload.title, content=payload.content)
    db.add(mem)
    db.commit()
    db.refresh(mem)
    return mem


@router.delete("/memories/{memory_id}", status_code=204, summary="删除记忆")
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    mem = db.get(Memory, memory_id)
    if mem:
        db.delete(mem)
        db.commit()
    return None


# ---------- Tenants ----------
@router.get("/tenants", response_model=list[TenantOut], summary="租户列表")
def list_tenants(db: Session = Depends(get_db)):
    return db.query(Tenant).order_by(Tenant.id).all()


# ---------- Roles / permissions ----------
@router.get("/roles", response_model=list[RoleOut], summary="角色与权限")
def list_roles():
    return ROLES


# ---------- Token usage (derived from AI events) ----------
@router.get("/token-usage", response_model=TokenUsageOut, summary="Token 消耗统计")
def token_usage(db: Session = Depends(get_db)):
    per_call = 350  # 估算每次 AI 调用的 token
    today = datetime.utcnow().date()
    total_calls = (
        db.query(func.count(Event.id)).filter(Event.type == "ai.suggestion").scalar() or 0
    )
    by_day: list[TokenUsagePoint] = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        start = datetime(day.year, day.month, day.day)
        end = start + timedelta(days=1)
        calls = (
            db.query(func.count(Event.id))
            .filter(Event.type == "ai.suggestion", Event.created_at >= start, Event.created_at < end)
            .scalar()
            or 0
        )
        by_day.append(TokenUsagePoint(date=day.isoformat(), tokens=calls * per_call))

    total_tokens = total_calls * per_call
    return TokenUsageOut(
        total_calls=total_calls,
        total_tokens=total_tokens,
        by_day=by_day,
        by_model=[{"model": "deepseek-chat", "tokens": total_tokens, "calls": total_calls}],
    )
