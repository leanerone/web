from sqlalchemy import Column, Integer, String, Text, Date, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.session import Base
import enum


class ProjectStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    paused = "paused"
    cancelled = "cancelled"


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    blocked = "blocked"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class EquipmentStatus(str, enum.Enum):
    online = "online"
    offline = "offline"
    maintenance = "maintenance"
    decommissioned = "decommissioned"


class RequirementStatus(str, enum.Enum):
    dev = "dev"                # 开发中
    testing = "testing"        # 测试中
    deploying = "deploying"    # 上线中
    completed = "completed"    # 已完成


class RequirementPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(SQLAlchemyEnum(ProjectStatus), default=ProjectStatus.active)
    start_date = Column(Date)
    end_date = Column(Date)
    progress = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 子行交由 FK 的 ondelete 规则处理（tasks CASCADE；其余 SET NULL / CASCADE）
    tasks = relationship("Task", back_populates="project", passive_deletes=True)
    requirements = relationship("Requirement", back_populates="project", passive_deletes=True)
    notes_documents = relationship("NotesDocument", back_populates="project", passive_deletes=True)
    work_items = relationship("WorkItem", back_populates="project", passive_deletes=True)


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.pending, index=True)
    priority = Column(SQLAlchemyEnum(TaskPriority), default=TaskPriority.medium, index=True)
    due_date = Column(Date, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 项目删除时任务随之删除（DB 级 CASCADE，ORM 不再逐行处理）
    project = relationship("Project", back_populates="tasks", passive_deletes=True)


class EquipmentType(Base):
    """机台类型字典 — Oracle 中是视图(从 EQUIPMENTINFO 去重)，SQLite 中是普通表"""
    __tablename__ = "equipment_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    manufacturer = Column(String(100))


class Equipment(Base):
    """直接映射量产表 PANJOB.EQUIPMENTINFO (18 列，EQUIPMENT 作主键)

    - 用 PANJOB 账号连接，表名 = EQUIPMENTINFO，无需 schema 前缀
    - 量产表只读：后端不提供 POST/PUT/DELETE
    - status / location / driver_version 等非真实列在 schema 层 @computed_field 派生
    """
    __tablename__ = "EQUIPMENTINFO"

    equipment        = Column("EQUIPMENT", String(32), primary_key=True, index=True)   # 1. 机台编号 (主键)
    equipment_type  = Column("EQUIPMENTTYPE", String(32))                # 2. 机台类型 (例: PECVD)
    equipment_model = Column("EQUIPMENTMODEL", String(32))               # 3. 机台型号 (例: ASM Eagle-10)
    line            = Column("LINE", String(32))                         # 4. 产线 (例: T13)
    cc_server       = Column("CCSERVER", String(32))                     # 5. CC 服务器 (例: C01C225)
    area            = Column("AREA", String(32))                        # 6. 厂区/区域 (例: TF)
    moxa            = Column("MOXA", String(32))                         # 7. 串口速率/类型 (例: 9600)
    nport           = Column("NPORT", String(32))                        # 8. NPort 端口号
    nport_ip        = Column("NPORTIP", String(32))                     # 9. NPort IP 地址
    nport_com       = Column("NPORTCOM", String(32))                     # 10. NPort COM 号
    chargeman       = Column("CHARGEMAN", String(32))                    # 11. 负责人 (例: S.Q)
    smif1_nport_ip  = Column("SMIF1NPORTIP", String(32))                 # 12. SMIF1 NPort IP
    smif2_nport_ip  = Column("SMIF2NPORTIP", String(32))                 # 13. SMIF2 NPort IP
    smif3_nport_ip  = Column("SMIF3NPORTIP", String(32))                 # 14. SMIF3 NPort IP
    smif4_nport_ip  = Column("SMIF4NPORTIP", String(32))                 # 15. SMIF4 NPort IP
    os              = Column("OS", String(32))                           # 16. 操作系统 (例: Win2019)
    srv_type        = Column("SRVTYPE", String(32))                      # 17. 服务器类型 (例: DL380 G8)
    source_code     = Column("SOURCECODE", String(32))                   # 18. 源码分类码 → Git URL 映射键

    configurations = relationship("Configuration", back_populates="equipment")


class Configuration(Base):
    __tablename__ = "configurations"

    id = Column(Integer, primary_key=True, index=True)
    equipment_name = Column(String(32), ForeignKey("EQUIPMENTINFO.EQUIPMENT"), index=True)
    config_key = Column(String(100), nullable=False)
    config_value = Column(Text)
    version = Column(String(20))
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

    equipment = relationship("Equipment", back_populates="configurations")


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    # 多机台关联: 存 JSON 数组字符串, 如 ["CATEOX-57","GATEOX-57"]
    # (去掉单值 FK 约束, 支持按 EquipmentType/Model 多选)
    equipment_name = Column(String(1000), nullable=True)
    notes_url = Column(String(1000), nullable=True)
    notes_doc_id = Column(Integer, nullable=True)
    status = Column(SQLAlchemyEnum(RequirementStatus), default=RequirementStatus.dev, index=True)
    priority = Column(SQLAlchemyEnum(RequirementPriority), default=RequirementPriority.medium, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="requirements")
    change_records = relationship("ChangeRecord", back_populates="requirement", passive_deletes=True)


class ChangeRecord(Base):
    __tablename__ = "change_records"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id", ondelete="CASCADE"), index=True)
    change_type = Column(String(50), nullable=False)
    description = Column(Text)
    file_path = Column(String(500))
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

    requirement = relationship("Requirement", back_populates="change_records")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    report_date = Column(Date, nullable=False)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class NotesDocument(Base):
    __tablename__ = "notes_documents"

    id = Column(Integer, primary_key=True, index=True)
    notes_id = Column(String(100), index=True)
    title = Column(String(200))
    content = Column(Text)
    url = Column(String(500))
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="notes_documents")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    # PBKDF2-SHA256 哈希（pbkdf2_sha256$<salt>$<digest>）；SSO 用户可为空
    password_hash = Column(String(255))
    display_name = Column(String(200))
    email = Column(String(200))
    role = Column(String(50), default="user")
    department = Column(String(100))
    team = Column(String(100))
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text)
    description = Column(String(500))
    category = Column(String(50), default="general")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WorkCategory(Base):
    __tablename__ = "work_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(500))
    icon = Column(String(50))
    color = Column(String(20))
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_items = relationship("WorkItem", back_populates="category")


class WorkItem(Base):
    __tablename__ = "work_items"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("work_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(500), nullable=False)
    details = Column(Text)
    urgency = Column(String(20), default="na", index=True)
    importance = Column(String(20), default="na", index=True)
    status = Column(String(30), default="pending", index=True)
    priority_score = Column(Float, default=0.0, index=True)
    due_date = Column(Date, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    source_type = Column(String(50), default="manual")
    source_url = Column(String(1000))
    ai_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("WorkCategory", back_populates="work_items")
    project = relationship("Project", back_populates="work_items")
    # 工作项删除时审计日志随之删除（避免孤儿行）
    logs = relationship("WorkLog", back_populates="work_item", passive_deletes=True)


class DailyPlan(Base):
    __tablename__ = "daily_plans"

    id = Column(Integer, primary_key=True, index=True)
    plan_date = Column(Date, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    items_order = Column(Text)
    ai_suggestions = Column(Text)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class WorkLog(Base):
    __tablename__ = "work_logs"

    id = Column(Integer, primary_key=True, index=True)
    work_item_id = Column(Integer, ForeignKey("work_items.id", ondelete="CASCADE"), index=True)
    action = Column(String(50), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    work_item = relationship("WorkItem", back_populates="logs")
