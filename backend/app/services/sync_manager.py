from typing import Dict, Any, Optional
import time
import logging

logger = logging.getLogger(__name__)


class SyncManager:
    _instance = None
    _status: Dict[str, Dict[str, Any]] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SyncManager, cls).__new__(cls)
        return cls._instance

    def get_status(self, user_id: str) -> Dict[str, Any]:
        """Get the current sync status for a user."""
        status = self._status.get(str(user_id), {"status": "idle"})
        # Add elapsed time if running
        if status.get("status") == "running" and "start_time" in status:
            status["elapsed_seconds"] = round(time.time() - status["start_time"], 1)
        return status

    def start_sync(self, user_id: str, total: int = 0, type: str = "manual"):
        """Initialize sync state for a user."""
        self._status[str(user_id)] = {
            "status": "running",
            "phase": "initializing",
            "type": type,
            "processed": 0,
            "total": total,
            "start_time": time.time(),
            "message": "Starting sync...",
            "stats": {"stored": 0, "skipped": 0, "failed": 0},
        }
        logger.info(f"SyncManager: Sync started for user {user_id} (type={type})")

    def set_phase(self, user_id: str, phase: str, message: Optional[str] = None):
        """Update the current phase of the sync."""
        uid = str(user_id)
        if uid in self._status:
            self._status[uid]["phase"] = phase
            if message:
                self._status[uid]["message"] = message
            logger.info(f"SyncManager: Phase '{phase}' for user {user_id}" + (f" — {message}" if message else ""))

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

    def update_stats(self, user_id: str, stored: int = 0, skipped: int = 0, failed: int = 0):
        """Update stored/skipped/failed counts."""
        uid = str(user_id)
        if uid in self._status and "stats" in self._status[uid]:
            self._status[uid]["stats"]["stored"] += stored
            self._status[uid]["stats"]["skipped"] += skipped
            self._status[uid]["stats"]["failed"] += failed

    def finish_sync(self, user_id: str, status: str = "completed", message: str = "Sync complete"):
        """Mark sync as finished."""
        uid = str(user_id)
        if uid in self._status:
            self._status[uid]["status"] = status
            self._status[uid]["phase"] = status
            self._status[uid]["message"] = message
            self._status[uid]["end_time"] = time.time()
            elapsed = self._status[uid]["end_time"] - self._status[uid].get("start_time", self._status[uid]["end_time"])
            stats = self._status[uid].get("stats", {})
            logger.info(
                f"SyncManager: Sync {status} for user {user_id} in {elapsed:.1f}s — "
                f"stored={stats.get('stored', 0)}, skipped={stats.get('skipped', 0)}, failed={stats.get('failed', 0)}"
            )

    def clear_status(self, user_id: str):
        """Clear status for a user (optional cleanup)."""
        uid = str(user_id)
        if uid in self._status:
            del self._status[uid]

sync_manager = SyncManager()
