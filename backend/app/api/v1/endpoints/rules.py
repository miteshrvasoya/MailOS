from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.api import deps
from app.models.rule import Rule

router = APIRouter()

@router.get("/", response_model=List[Rule])
def read_rules(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(deps.get_db)
):
    rules = db.exec(select(Rule).offset(skip).limit(limit)).all()
    return rules

@router.post("/", response_model=Rule)
def create_rule(rule: Rule, db: Session = Depends(deps.get_db)):
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/{rule_id}", response_model=Rule)
def read_rule(rule_id: str, db: Session = Depends(deps.get_db)):
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule
