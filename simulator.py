from mock_data.weather_mock import set_weather
from mock_data.platform_mock import set_platform_data, reset_platform
from mock_data.govt_alerts_mock import set_govt_alerts
from mock_data.peer_gps_mock import set_global_disruption


class Simulator:
    """Realistic event timeline simulator for demo purposes."""

    def reset_to_normal(self):
        """Clear all states to sunny-day baseline."""
        reset_platform()
        for pin in ["400001", "400002", "400003", "400004", "400005"]:
            set_weather(pin, rainfall=0.0, wind_speed=10.0, visibility=10.0)
        for cat in ["food_delivery", "ecommerce", "qcommerce"]:
            set_platform_data(cat,
                order_drop_pct=5.0, delivery_completion_pct=95.0,
                delivery_completion_drop=3.0, sla_breach_pct=5.0,
                rider_supply_pct=95.0, rider_supply_drop_pct=5.0,
                order_surge_rate=105, zone_reachability=95,
                zone_unreachable_hours=0, road_flood_index=5,
            )
        set_govt_alerts(lockdown=False, unrest=False, hazard=False, flood_zones=[])
        set_global_disruption(0.1)

    def trigger_rain_event(self, pincode="400001", intensity=45, drop_pct=55):
        """Simulate heavy rain affecting all categories."""
        set_weather(pincode, rainfall=intensity, wind_speed=35.0, visibility=2.0)
        set_platform_data("food_delivery",
            order_drop_pct=drop_pct, delivery_completion_pct=55.0,
            delivery_completion_drop=40.0, sla_breach_pct=50.0,
        )
        set_platform_data("ecommerce",
            order_drop_pct=15.0, delivery_completion_pct=70.0,
            delivery_completion_drop=25.0, road_flood_index=75,
            zone_reachability=30, zone_unreachable_hours=3,
        )
        set_platform_data("qcommerce",
            order_drop_pct=10.0, sla_breach_pct=65.0,
            order_surge_rate=220, rider_supply_drop_pct=55.0,
            rider_supply_pct=45.0,
        )
        set_global_disruption(0.85)

    def trigger_pandemic_lockdown(self):
        """Activate pandemic lockdown – exclusion gate will reject all claims."""
        set_govt_alerts(lockdown=True)

    def trigger_civil_unrest(self):
        """Activate civil unrest alert."""
        set_govt_alerts(unrest=True)
        set_global_disruption(0.9)

    def trigger_flood_event(self, pincode="400001"):
        """Simulate severe flooding."""
        set_weather(pincode, rainfall=50.0, wind_speed=45.0, visibility=1.0)
        set_platform_data("ecommerce",
            road_flood_index=95, zone_reachability=10,
            zone_unreachable_hours=5, delivery_completion_drop=60.0,
        )
        set_platform_data("food_delivery",
            order_drop_pct=70.0, delivery_completion_pct=30.0,
        )
        set_platform_data("qcommerce",
            sla_breach_pct=80.0, order_surge_rate=250,
            rider_supply_drop_pct=65.0,
        )
        set_global_disruption(0.95)
