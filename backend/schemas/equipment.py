from pydantic import (
    BaseModel, Field, ConfigDict, computed_field,
)
from datetime import date, datetime
from typing import Optional


class EquipmentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None


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


class EquipmentResponse(BaseModel):
    """机台列表/详情返回 (ORM 7 字段 + 量产 18 字段 + 前端兼容别名)

    - 量产真实字段: equipment, equipment_type ... source_code
    - 前端兼容字段(@computed_field): 自动映射到原前端 Equipment.tsx 的 eq_* / ap_* / vendor / driver1_ip 等
    """
    model_config = ConfigDict(from_attributes=True)

    # ── ORM 核心字段 ──
    id: int
    type_id: int
    name: str
    location: Optional[str] = None
    status: str
    driver_version: Optional[str] = None
    installed_at: Optional[date] = None
    updated_at: Optional[datetime] = None
    type: Optional[EquipmentTypeResponse] = None

    # ── 量产真实字段 (PANJOB.EQUIPMENTINFO 18 列 + 2 预留列) ──
    equipment: Optional[str] = None
    equipment_type: Optional[str] = Field(default=None, validation_alias="EQUIPMENTTYPE")
    equipment_model: Optional[str] = Field(default=None, validation_alias="EQUIPMENTMODEL")
    line: Optional[str] = Field(default=None, validation_alias="LINE")
    cc_server: Optional[str] = Field(default=None, validation_alias="CCSERVER")
    area: Optional[str] = Field(default=None, validation_alias="AREA")
    moxa: Optional[str] = Field(default=None, validation_alias="MOXA")
    nport: Optional[str] = Field(default=None, validation_alias="NPORT")
    nport_ip: Optional[str] = Field(default=None, validation_alias="NPORTIP")
    nport_com: Optional[str] = Field(default=None, validation_alias="NPORTCOM")
    chargeman: Optional[str] = Field(default=None, validation_alias="CHARGEMAN")
    smif1_nport_ip: Optional[str] = Field(default=None, validation_alias="SMIF1NPORTIP")
    smif2_nport_ip: Optional[str] = Field(default=None, validation_alias="SMIF2NPORTIP")
    smif3_nport_ip: Optional[str] = Field(default=None, validation_alias="SMIF3NPORTIP")
    smif4_nport_ip: Optional[str] = Field(default=None, validation_alias="SMIF4NPORTIP")
    os: Optional[str] = Field(default=None, validation_alias="OS")
    srv_type: Optional[str] = Field(default=None, validation_alias="SRVTYPE")
    source_code: Optional[str] = Field(default=None, validation_alias="SOURCECODE")
    extra_19: Optional[str] = Field(default=None, validation_alias="EXTRA19")
    extra_20: Optional[str] = Field(default=None, validation_alias="EXTRA20")

    # ── 前端页面兼容字段 (@computed_field 会自动序列化到 JSON) ──
    @computed_field
    @property
    def eq_name(self) -> str:
        return self.equipment or self.name

    @computed_field
    @property
    def eq_type(self) -> str:
        if self.equipment_type:
            return self.equipment_type
        return self.type.name if self.type else ""

    @computed_field
    @property
    def eq_model(self) -> str:
        return self.equipment_model or ""

    @computed_field
    @property
    def vendor(self) -> str:
        return (self.type.manufacturer if self.type else "") or ""

    @computed_field
    @property
    def server_id(self) -> str:
        return self.cc_server or ""

    @computed_field
    @property
    def driver_type(self) -> str:
        return self.srv_type or ""

    @computed_field
    @property
    def snmp_ip(self) -> str:
        return self.nport_ip or ""

    @computed_field
    @property
    def snmp_port(self) -> str:
        return self.nport or ""

    @computed_field
    @property
    def driver1_ip(self) -> str:
        return self.nport_ip or ""

    @computed_field
    @property
    def driver1_port(self) -> str:
        return self.nport_com or ""

    @computed_field
    @property
    def driver2_ip(self) -> str:
        return self.smif1_nport_ip or ""

    @computed_field
    @property
    def driver2_port(self) -> str:
        return self.smif2_nport_ip or ""

    @computed_field
    @property
    def baud_rate(self) -> str:
        return self.moxa or ""

    @computed_field
    @property
    def ap_id(self) -> int:
        return self.id

    @computed_field
    @property
    def ap_name(self) -> str:
        return self.cc_server or f"AP-{self.id:03d}"


class ConfigurationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    equipment_id: int
    config_key: str
    config_value: str
    version: Optional[str] = None
    applied_at: datetime
