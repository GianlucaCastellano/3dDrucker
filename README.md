# 3D-Drucker Warteschlange

Kleines Projekt für eine 3D-Drucker-Queue mit FastAPI und Vanilla JS. 

Man kann Aufträge eintragen, die dann nach dem First-In-First-Out-Prinzip abgearbeitet werden. Es kann immer nur ein Auftrag gleichzeitig auf "drucken" stehen. Gespeichert wird alles lokal in einer `queue.json`.

## Starten

1. Pakete installieren:
```bash
pip install fastapi uvicorn
```

2. Backend starten:
```bash
python -m uvicorn main:app --reload
```
Der Server läuft dann auf `http://127.0.0.1:8000` (Swagger UI unter `http://127.0.0.1:8000/docs`).

3. Frontend öffnen:
Einfach die `index.html` im Browser öffnen.

## Routen

* **GET `/jobs`**
  Gibt alle aktuellen Aufträge aus der `queue.json` zurück.

* **POST `/jobs`**
  Erstellt einen neuen Auftrag (Status ist standardmäßig `warten`).
  Body:
  ```json
  {
    "name": "Max",
    "fileName": "teil.stl",
    "estimatedTime": 60
  }
  ```

* **PATCH `/jobs/{jobId}/status`**
  Ändert den Status eines Auftrags (`warten`, `drucken`, `fertig`). Geht nur auf `drucken`, wenn der Drucker frei ist und der Auftrag als nächstes dran ist.
  Body:
  ```json
  {
    "status": "drucken"
  }
  ```

* **DELETE `/jobs/{jobId}`**
  Löscht den Auftrag mit der entsprechenden ID.