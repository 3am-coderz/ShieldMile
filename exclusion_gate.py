from mock_data.worker_history_mock import get_worker


class ExclusionChecker:
    """
    Mandatory exclusion gate – must run BEFORE CDI calculation.
    If any exclusion matches → reject immediately.

    A. Standard Insurance Exclusions (hardcoded):
       WAR, CIVIL_UNREST, PANDEMIC_LOCKDOWN, NUCLEAR_CHEMICAL

    B. Product-Specific Exclusions:
       OUTSIDE_ZONE, UNREGISTERED_DEVICE, CONCURRENT_COVERAGE,
       GPS_SPOOFING, INTENTIONAL_ACT
    """

    @staticmethod
    def check_all(
        worker_id: str,
        current_gps: dict,
        device_id: str,
        govt_alerts: dict,
        concurrent_flag: bool = False,
    ) -> tuple:
        """Returns (passed: bool, reason: str)"""
        worker = get_worker(worker_id)
        if not worker:
            return False, "UNKNOWN_WORKER"

        # --- A. Standard Insurance Exclusions ---
        if govt_alerts.get("civil_unrest"):
            return False, "WAR_CIVIL_UNREST"
        if govt_alerts.get("lockdown_active"):
            return False, "PANDEMIC_LOCKDOWN"
        if govt_alerts.get("nuclear_chemical_hazard"):
            return False, "NUCLEAR_CHEMICAL"

        # --- B. Product-Specific Exclusions ---

        # Unregistered Device
        if device_id != worker.get("device_id"):
            return False, "UNREGISTERED_DEVICE"

        # Outside Operating Zone (GPS outside registered pincode cluster)
        if current_gps.get("outside_zone", False):
            return False, "OUTSIDE_ZONE"

        # GPS Spoofing: location jump > 50 km in < 5 minutes → speed > 600 km/h
        if current_gps.get("speed_kmh", 0) > 600:
            return False, "GPS_SPOOFING"

        # Intentional Act: worker GPS stationary at home during rain > 30 min
        if current_gps.get("stationary_at_home_min", 0) > 30:
            return False, "INTENTIONAL_ACT"

        # Concurrent Coverage: same hour claimed via another insurer
        if concurrent_flag:
            return False, "CONCURRENT_COVERAGE"

        return True, "PASSED"
