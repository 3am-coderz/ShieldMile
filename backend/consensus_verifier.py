from mock_data.peer_gps_mock import get_peers_in_radius


def verify_zone_consensus(worker_id: str, current_gps: dict, zone_pincode: str) -> float:
    """
    Zone consensus fraud prevention.
    Query 10-20 peer workers in same 2 km radius.
    Returns trust_score (0.0 to 1.0) = peer_agreement_rate.
    """
    peers = get_peers_in_radius(current_gps, radius_km=2.0)
    if not peers:
        return 1.0  # No peers → benefit of doubt

    reporting_disruption = sum(1 for p in peers if p.get("reported_disruption", False))
    trust_score = reporting_disruption / len(peers)
    return round(float(trust_score), 2)


def apply_consensus(raw_cdi: float, trust_score: float) -> tuple:
    """
    Apply consensus logic to raw CDI:
      >= 0.7 trust → multiply by 1.0, status 'TRUSTED'
      0.3-0.7      → reduce CDI proportionally, status 'FLAGGED'
      < 0.3        → CDI = 0, status 'REJECTED'

    Returns (final_cdi, status)
    """
    if trust_score >= 0.7:
        return raw_cdi, "TRUSTED"
    elif trust_score >= 0.3:
        return round(raw_cdi * trust_score, 2), "FLAGGED"
    else:
        return 0.0, "REJECTED"
