import pytest
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from cdi_engine import normalize, calculate_cdi, get_payout_rate, get_threshold, get_caps, check_secondary_conditions
from exclusion_gate import ExclusionChecker
from consensus_verifier import apply_consensus, verify_zone_consensus
from risk_management import add_payout, check_stop_loss, evaluate_reinsurance, reset as rmd_reset
from mock_data.worker_history_mock import initialize_workers


@pytest.fixture(autouse=True)
def setup():
    initialize_workers()
    rmd_reset()


# ── CDI Tests ──

class TestCDINormalization:
    def test_normal(self):
        assert normalize(25, 50) == 50.0

    def test_inverted(self):
        assert normalize(10, 10, inverted=True) == 0.0
        assert normalize(2, 10, inverted=True) == 80.0

    def test_clamp(self):
        assert normalize(100, 50) == 100.0
        assert normalize(-5, 50) == 0.0


class TestCDIEngine:
    def test_food_delivery(self):
        v = {"rainfall": 40, "wind_speed": 40, "visibility": 2, "order_drop_pct": 60}
        score = calculate_cdi("food_delivery", v)
        assert 70 < score < 90

    def test_ecommerce(self):
        v = {"road_flood_index": 80, "rainfall": 30, "zone_reachability": 20, "delivery_completion_drop": 50}
        score = calculate_cdi("ecommerce", v)
        assert score > 50

    def test_unknown_category(self):
        assert calculate_cdi("unknown", {}) == 0.0

    def test_payout_rate_food(self):
        assert get_payout_rate("food_delivery", 50) == 0
        assert get_payout_rate("food_delivery", 70) == 30
        assert get_payout_rate("food_delivery", 80) == 50
        assert get_payout_rate("food_delivery", 90) == 75

    def test_payout_rate_qcom_rider(self):
        assert get_payout_rate("qcommerce", 65, "rider") == 50
        assert get_payout_rate("qcommerce", 80, "rider") == 80

    def test_payout_rate_qcom_picker(self):
        assert get_payout_rate("qcommerce", 65, "picker") == 30
        assert get_payout_rate("qcommerce", 80, "picker") == 60

    def test_thresholds(self):
        assert get_threshold("food_delivery") == 65
        assert get_threshold("ecommerce") == 70
        assert get_threshold("qcommerce") == 60


class TestSecondaryConditions:
    def test_food(self):
        assert check_secondary_conditions("food_delivery", {"order_drop_pct": 50}) == True
        assert check_secondary_conditions("food_delivery", {"order_drop_pct": 30}) == False

    def test_ecom(self):
        assert check_secondary_conditions("ecommerce", {"zone_unreachable_hours": 3}) == True
        assert check_secondary_conditions("ecommerce", {"zone_unreachable_hours": 1}) == False

    def test_qcom(self):
        assert check_secondary_conditions("qcommerce", {"sla_breach_pct": 60}) == True
        assert check_secondary_conditions("qcommerce", {"sla_breach_pct": 40}) == False


# ── Exclusion Gate Tests ──

class TestExclusionGate:
    def _gps(self, **kw):
        return {"stationary_at_home_min": 0, "speed_kmh": 0, "outside_zone": False, **kw}

    def _alerts(self, **kw):
        return {"lockdown_active": False, "civil_unrest": False, "nuclear_chemical_hazard": False, **kw}

    def test_pandemic(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(), "DEVICE_food_delivery_1", self._alerts(lockdown_active=True))
        assert not ok and reason == "PANDEMIC_LOCKDOWN"

    def test_civil_unrest(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(), "DEVICE_food_delivery_1", self._alerts(civil_unrest=True))
        assert not ok and reason == "WAR_CIVIL_UNREST"

    def test_nuclear(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(), "DEVICE_food_delivery_1", self._alerts(nuclear_chemical_hazard=True))
        assert not ok and reason == "NUCLEAR_CHEMICAL"

    def test_gps_spoofing(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(speed_kmh=999), "DEVICE_food_delivery_1", self._alerts())
        assert not ok and reason == "GPS_SPOOFING"

    def test_unregistered_device(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(), "WRONG_DEVICE", self._alerts())
        assert not ok and reason == "UNREGISTERED_DEVICE"

    def test_outside_zone(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(outside_zone=True), "DEVICE_food_delivery_1", self._alerts())
        assert not ok and reason == "OUTSIDE_ZONE"

    def test_intentional_act(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(stationary_at_home_min=45), "DEVICE_food_delivery_1", self._alerts())
        assert not ok and reason == "INTENTIONAL_ACT"

    def test_pass(self):
        ok, reason = ExclusionChecker.check_all("worker_food_delivery_1", self._gps(), "DEVICE_food_delivery_1", self._alerts())
        assert ok and reason == "PASSED"


# ── Consensus Tests ──

class TestConsensus:
    def test_trusted(self):
        cdi, status = apply_consensus(80.0, 0.8)
        assert cdi == 80.0 and status == "TRUSTED"

    def test_flagged(self):
        cdi, status = apply_consensus(80.0, 0.5)
        assert cdi == 40.0 and status == "FLAGGED"

    def test_rejected(self):
        cdi, status = apply_consensus(80.0, 0.2)
        assert cdi == 0.0 and status == "REJECTED"


# ── Payout Caps Tests ──

class TestPayoutCaps:
    def test_food_caps(self):
        caps = get_caps("food_delivery")
        assert caps["max_hours_per_event"] == 6
        assert caps["max_payout_per_event"] == 450
        assert caps["max_payout_per_week"] == 900

    def test_ecom_caps(self):
        caps = get_caps("ecommerce")
        assert caps["max_payout_per_event"] == 540


# ── Stop-Loss Tests ──

class TestStopLoss:
    def test_under_limit(self):
        add_payout("test_city", 100000)
        assert check_stop_loss("test_city") == False

    def test_over_limit(self):
        add_payout("test_city2", 600000)
        assert check_stop_loss("test_city2") == True

    def test_reinsurance(self):
        add_payout("test_city3", 1500000)
        result = evaluate_reinsurance()
        assert result["reinsurance_covered"] > 0
