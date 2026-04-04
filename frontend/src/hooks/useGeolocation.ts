import { useState, useEffect } from "react";

export interface GeoLocationState {
  loaded: boolean;
  coordinates?: { lat: number; lng: number };
  error?: { code: number; message: string };
  locationName?: string;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocationState>({
    loaded: false,
    coordinates: { lat: 13.0827, lng: 80.2707 }, // default to Chennai center
  });

  const onSuccess = async (locationData: GeolocationPosition) => {
    let locName = "Live Coordinates";
    try {
       // Reverse geocoding fallback (similar to 1.5 frontend logic)
       const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${locationData.coords.latitude}&longitude=${locationData.coords.longitude}&localityLanguage=en`);
       if (geoRes.ok) {
           const geoData = await geoRes.json();
           locName = geoData.locality || geoData.city || geoData.principalSubdivision || locName;
       }
    } catch(e) {}

    setLocation({
      loaded: true,
      coordinates: {
        lat: locationData.coords.latitude,
        lng: locationData.coords.longitude,
      },
      locationName: locName
    });
  };

  const onError = (error: GeolocationPositionError) => {
    setLocation({
      loaded: true,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  };

  const requestLocation = () => {
     if (!("geolocation" in navigator)) {
       onError({
         code: 0,
         message: "Geolocation not supported",
         PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3
       } as GeolocationPositionError);
     } else {
       navigator.geolocation.getCurrentPosition(onSuccess, onError);
     }
  };

  // Do not request by default; let the user click a button like 1.5 "Use Live Location"
  return { location, requestLocation };
}
