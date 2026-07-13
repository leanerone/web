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
    pending = "pending"
    in_progress = "in_progress"
    testing = "testing"
    completed = "completed"
    rejected = "rejected"


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

    tasks = relationship("Task", back_populates="project")
    notes_documents = relationship("NotesDocument", back_populates="project")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(SQLAlchemyEnum(TaskStatus), default=TaskStatus.pending)
    priority = Column(SQLAlchemyEnum(TaskPriority), default=TaskPriority.medium)
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="tasks")


class EquipmentType(Base):
    __tablename__ = "equipment_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    manufacturer = Column(String(100))

    equipments = relationship("Equipment", back_populates="type")


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    type_id = Column(Integer, ForeignKey("equipment_types.id"))
    name = Column(String(100), nullable=False)
    location = Column(String(100))
    status = Column(SQLAlchemyEnum(EquipmentStatus), default=EquipmentStatus.online)
    driver_version = Column(String(50))
    installed_at = Column(Date)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    type = relationship("EquipmentType", back_populates="equipments")
    requirements = relationship("Requirement", back_populates="equipment")
    configurations = relationship("Configuration", back_populates="equipment")


class Configuration(Base):
    __tablename__ = "configurations"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
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
    priority = Column(SQLAlchemyEnum(RequirementPriority), default=RequirementPriority.medium)
    status = Column(SQLAlchemyEnum(RequirementStatus), default=RequirementStatus.pending)
    equipment_id = Column(Integer, ForeignKey("equipment.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    equipment = relationship("Equipment", back_populates="requirements")
    change_records = relationship("ChangeRecord", back_populates="requirement")


class ChangeRecord(Base):
    __tablename__ = "change_records"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"))
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
    notes_id = Column(String(100))
    title = Column(String(200))
    content = Column(Text)
    url = Column(String(500))
    project_id = Column(Integer, ForeignKey("projects.id"))
    sync_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    project = relationship("Project", back_populates="notes_documents")
