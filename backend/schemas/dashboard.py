from pydantic import BaseModel


class DashboardStatsResponse(BaseModel):
    total_projects: int
    active_projects: int
    total_equipment: int
    online_equipment: int
    pending_requirements: int
    completed_tasks: int
    weekly_tasks: int
    completion_rate: float
