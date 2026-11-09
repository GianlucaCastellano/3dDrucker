from pydantic import BaseModel

class PrintJobCreate(BaseModel):
    name: str
    fileName: str
    estimatedTime: int

class PrintJob(PrintJobCreate):
    id: int
    status: str