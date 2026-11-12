import json
import os
from typing import List

FILE_PATH = "queue.json"

def loadQueue() -> List[dict]:
    if not os.path.exists(FILE_PATH):
        saveQueue([])
        return []

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def saveQueue(queue: List[dict]):
    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=4)