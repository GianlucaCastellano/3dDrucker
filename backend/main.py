import time
from database import loadQueue, saveQueue
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PrintJob, PrintJobCreate
from pydantic import BaseModel

app = FastAPI(title="3D Printer Queue API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class StatusUpdate(BaseModel):
    status: str


@app.get("/jobs", response_model=list[PrintJob])
def getQueue():
    return loadQueue()


@app.post("/jobs", response_model=PrintJob, status_code=201)
def createJob(job: PrintJobCreate):
    queue = loadQueue()
    newId = max([j["id"] for j in queue], default=0) + 1

    newJob = {
        "id": newId,
        "name": job.name,
        "fileName": job.fileName,
        "estimatedTime": job.estimatedTime,
        "status": "warten",
        "startedAt": None,
    }

    queue.append(newJob)
    saveQueue(queue)
    return newJob


@app.patch("/jobs/{jobId}/status", response_model=PrintJob)
def updateJobStatus(jobId: int, body: StatusUpdate):
    if body.status not in ["warten", "drucken", "fertig"]:
        raise HTTPException(status_code=400, detail="Ungültiger Status")

    queue = loadQueue()

    if body.status == "drucken":
        for job in queue:
            if job["status"] == "drucken" and job["id"] != jobId:
                raise HTTPException(
                    status_code=409, detail="Der Drucker ist bereits belegt!"
                )

        waiting_jobs = [j for j in queue if j["status"] == "warten"]
        if waiting_jobs and jobId != waiting_jobs[0]["id"]:
            raise HTTPException(
                status_code=400,
                detail="FIFO-Regel: Erst den ältesten Auftrag drucken!",
            )

    for job in queue:
        if job["id"] == jobId:
            job["status"] = body.status
            if body.status == "drucken":
                job["startedAt"] = time.time()  # Startzeitpunkt merken
            saveQueue(queue)
            return job

    raise HTTPException(status_code=404, detail="Auftrag nicht gefunden")


@app.delete("/jobs/{jobId}")
def deleteJob(jobId: int):
    queue = loadQueue()
    filteredQueue = [j for j in queue if j["id"] != jobId]

    if len(filteredQueue) == len(queue):
        raise HTTPException(status_code=404, detail="Auftrag nicht gefunden")

    saveQueue(filteredQueue)
    return {"message": f"Auftrag {jobId} wurde gelöscht"}