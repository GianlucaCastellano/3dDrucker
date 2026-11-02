import json
import os
from typing import List

FILE_PATH = "queue.json"

def loadQueue() -> List[dict]:
    #Erstellt Datei falls sie nicht existiert und gibt Leeres Array zurück
    if not os.path.exists(FILE_PATH):
        saveQueue([])
        return []

    with open(FILE_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []