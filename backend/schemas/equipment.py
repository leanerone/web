from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class EquipmentTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None

    class Config:
        from_attributes = True


class EquipmentBase(BaseModel):
    name: str
    location: Optional[str] = None
    driver_version: Optional[str] = None
    installed_at: Optional[date] = None


class EquipmentCreate(EquipmentBase):
    type_id: int


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    type_id: Optional[int] = None
    location: Optional[str] = None
    status: Optional[str] = None
    driver_version: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    id: int
    type_id: int
    status: str
    updated_at: datetime
    type: Optional[EquipmentTypeResponse] = None

    class Config:
        from_attributes = True


class ConfigurationResponse(BaseModel):
    id: int
    equipment_id: int
    config_key: str
    config_value: str
    version: Optional[str] = None
    applied_at: datetime

    class Config:
        from_attributes = True
