from typing import List, Optional
from hive_core.domain.models import ObservationEvent
import threading

class LedgerRepository:
    def __init__(self):
        self._events: List[ObservationEvent] = []
        self._cursor: int = 0
        self._lock = threading.Lock()

    def append(self, event: ObservationEvent) -> bool:
        with self._lock:
            if any(e.event_id == event.event_id for e in self._events):
                return False # Idempotent deduplication
            self._events.append(event)
            self._events.sort(key=lambda x: x.sequence)
            return True
            
    def get_all(self) -> List[ObservationEvent]:
        with self._lock:
            return self._events.copy()

    def get_up_to_cursor(self) -> List[ObservationEvent]:
        with self._lock:
            if self._cursor == 0:
                return []
            return [e for e in self._events if e.sequence <= self._cursor]

    def reset(self):
        with self._lock:
            self._cursor = 0

    def advance(self, to_sequence: Optional[int] = None):
        with self._lock:
            if not self._events:
                return
            if to_sequence is not None:
                self._cursor = to_sequence
            else:
                next_events = [e for e in self._events if e.sequence > self._cursor]
                if next_events:
                    self._cursor = min(e.sequence for e in next_events)

    def load_fixtures(self, events: List[ObservationEvent]):
        with self._lock:
            self._events = []
            for ev in events:
                self._events.append(ev)
            self._events.sort(key=lambda x: x.sequence)
            self._cursor = 0

