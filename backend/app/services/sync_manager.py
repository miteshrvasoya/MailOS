from typing import Dict, Any, Optional
import time

class SyncManager:
    _instance = None
    _status: Dict[str, Dict[str, Any]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SyncManager, cls).__new__(cls)
        return cls._instance

    def get_status(self, user_id: str) -> Dict[str, Any]:
        """Get the current sync status for a user."""
        return self._status.get(str(user_id), {"status": "idle"})

    def start_sync(self, user_id: str, total: int = 0, type: str = "manual"):
        """Initialize sync state for a user."""
        self._status[str(user_id)] = {
            "status": "running",
            "type": type,
            "processed": 0,
            "total": total,
            "start_time": time.time(),
            "message": "Starting sync..."
        }

    def update_progress(self, user_id: str, processed_inc: int = 1, message: Optional[str] = None):
        """Update items processed count."""
        uid = str(user_id)
        if uid in self._status:
            self._status[uid]["processed"] += processed_inc
            if message:
                self._status[uid]["message"] = message

    def set_total(self, user_id: str, total: int):
        """Update total items count if discovered later."""
        uid = str(user_id)
        if uid in self._status:
            self._status[uid]["total"] = total

    def finish_sync(self, user_id: str, status: str = "completed", message: str = "Sync complete"):
        """Mark sync as finished."""
        uid = str(user_id)
        if uid in self._status:
            self._status[uid]["status"] = status
            self._status[uid]["message"] = message
            self._status[uid]["end_time"] = time.time()
            
    def clear_status(self, user_id: str):
        """Clear status for a user (optional cleanup)."""
        uid = str(user_id)
        if uid in self._status:
            del self._status[uid]

sync_manager = SyncManager()
