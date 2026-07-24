from sqlalchemy.orm import Session
from database.models import User
from schemas.user import UserCreate, UserUpdate
from typing import List, Optional


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def create_user(db: Session, user: UserCreate) -> User:
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    for key, value in user.model_dump(exclude_unset=True).items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    db.delete(db_user)
    db.commit()
    return True


def init_default_users(db: Session):
    default_users = [
        {"username": "administrator", "display_name": "管理员", "role": "admin", "department": "IT", "team": "CIM", "email": "admin@company.com"},
        {"username": "eap.engineer", "display_name": "EAP工程师", "role": "engineer", "department": "制造", "team": "EAP", "email": "eap@company.com"},
        {"username": "cim.user", "display_name": "CIM用户", "role": "user", "department": "制造", "team": "CIM", "email": "cim@company.com"},
    ]
    
    for user_data in default_users:
        existing = get_user_by_username(db, user_data["username"])
        if not existing:
            create_user(db, UserCreate(**user_data))
