from typing import Optional
from pydantic import BaseModel


class PrintJobCreate(BaseModel):
    name: str
    fileName: str
    estimatedTime: int


class PrintJob(PrintJobCreate):
    id: int
    status: str
    startedAt: Optional[float] = None