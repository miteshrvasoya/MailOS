from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.api.deps import get_db
from app.models.user import User
from app.models.task import Task, TaskCreate, TaskUpdate
import uuid

router = APIRouter()

@router.get("/", response_model=List[Task])
def read_tasks(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: str | None = None,
) -> Any:
    """
    Retrieve tasks.
    """
    current_user = db.get(User, user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    query = select(Task).where(Task.user_id == current_user.id)
    if status:
        query = query.where(Task.status == status)
    
    query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)
    tasks = db.exec(query).all()
    return tasks

@router.post("/", response_model=Task)
def create_task(
    *,
    db: Session = Depends(get_db),
    task_in: TaskCreate,
    user_id: uuid.UUID = Query(...),
) -> Any:
    """
    Create new task.
    """
    current_user = db.get(User, user_id)
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found")

    data = task_in.model_dump() if hasattr(task_in, "model_dump") else task_in.dict()
    task = Task(**data, user_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.patch("/{id}", response_model=Task)
def update_task(
    *,
    db: Session = Depends(get_db),
    id: uuid.UUID,
    task_in: TaskUpdate,
    user_id: uuid.UUID = Query(...),
) -> Any:
    """
    Update a task.
    """
    task = db.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != user_id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    update_data = task_in.model_dump(exclude_unset=True) if hasattr(task_in, "model_dump") else task_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{id}", response_model=Task)
def delete_task(
    *,
    db: Session = Depends(get_db),
    id: uuid.UUID,
    user_id: uuid.UUID = Query(...),
) -> Any:
    """
    Delete a task.
    """
    task = db.get(Task, id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != user_id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    
    db.delete(task)
    db.commit()
    return task
