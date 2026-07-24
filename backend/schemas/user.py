from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    display_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = "user"
    department: Optional[str] = None
    team: Optional[str] = None
    status: Optional[str] = "active"


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    team: Optional[str] = None
    status: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
