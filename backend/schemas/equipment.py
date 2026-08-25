from pydantic import BaseModel, Field, ConfigDict, computed_field
from typing import Optional


class EquipmentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None


class EquipmentResponse(BaseModel):
    """直接映射 PANJOB.EQUIPMENTINFO 18 列 + @computed_field 派生前端兼容字段

    量产表只读，无 id/type_id/name/location/status 等列。
    status 由 OS 字段映射: Win% → online, NULL → offline, 其他 → maintenance
    """
    model_config = ConfigDict(from_attributes=True)

    # ── EQUIPMENTINFO 18 真实列 ──
    equipment: str                                               # 主键: 机台编号
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

    # ── 前端兼容 @computed_field ──
    @computed_field
    @property
    def id(self) -> str:
        """前端用 equipment 作为 key/路由参数"""
        return self.equipment

    @computed_field
    @property
    def eq_name(self) -> str:
        return self.equipment

    @computed_field
    @property
    def eq_type(self) -> str:
        return self.equipment_type or ""

    @computed_field
    @property
    def eq_model(self) -> str:
        return self.equipment_model or ""

    @computed_field
    @property
    def vendor(self) -> str:
        return ""

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
    def driver_version(self) -> str:
        return f"SRVTYPE:{self.srv_type or '?'} OS:{self.os or '?'}"

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
    def ap_id(self) -> str:
        return self.equipment

    @computed_field
    @property
    def ap_name(self) -> str:
        return self.cc_server or self.equipment

    @computed_field
    @property
    def status(self) -> str:
        """OS 含 Win → online, NULL → offline, 其他 → maintenance"""
        if not self.os:
            return "offline"
        return "online" if "WIN" in self.os.upper() else "maintenance"

    @computed_field
    @property
    def location(self) -> str:
        parts = []
        if self.line:
            parts.append(f"Line:{self.line}")
        if self.area:
            parts.append(f"Area:{self.area}")
        return " / ".join(parts) if parts else ""

    @computed_field
    @property
    def installed_at(self) -> Optional[str]:
        return None

    @computed_field
    @property
    def updated_at(self) -> Optional[str]:
        return None


class ConfigurationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    equipment_name: Optional[str] = None
    config_key: str
    config_value: str
    version: Optional[str] = None
    applied_at: str
