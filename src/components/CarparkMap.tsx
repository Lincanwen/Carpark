import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityStatus, getLotDetailForVehicle } from '../utils/carparkUtils';
import { Navigation, Compass } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  onOpenDetails: (carpark: Carpark) => void;
  vehicleType: VehicleType;
  userLocation: { lat: number; lng: number } | null;
}

const REGION_BOUNDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  All: { lat: 1.3521, lng: 103.8198, zoom: 12 },
  'Marina Bay': { lat: 1.2840, lng: 103.8580, zoom: 15 },
  Orchard: { lat: 1.3030, lng: 103.8340, zoom: 15 },
  East: { lat: 1.3450, lng: 103.9450, zoom: 13 },
  West: { lat: 1.3340, lng: 103.7450, zoom: 13 },
  North: { lat: 1.3650, lng: 103.8450, zoom: 13 },
};

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  onOpenDetails,
  vehicleType,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered on Singapore
    const map = L.map(mapContainerRef.current, {
      center: [1.3521, 103.8198],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Dark cartographic tiles for clean dashboard styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: `
            <div style="position: relative; width: 24px; height: 24px;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; inset: 4px; border-radius: 9999px; background-color: #3b82f6; border: 2px solid #ffffff; box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);"></div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-size: 12px; font-weight: 600; color: #60a5fa;">
            Your Current Location
          </div>
        `);
        userMarkerRef.current = marker;
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update Carpark Markers whenever carparks or vehicleType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    carparks.forEach((cp) => {
      const lotInfo = getLotDetailForVehicle(cp, vehicleType);
      const status = getAvailabilityStatus(lotInfo.available, lotInfo.total);

      let bgColor = '#10b981'; // green ample
      let textColor = '#ffffff';
      let borderColor = '#059669';

      if (status === 'limited') {
        bgColor = '#ef4444'; // red
        borderColor = '#b91c1c';
      } else if (status === 'moderate') {
        bgColor = '#f59e0b'; // amber
        borderColor = '#d97706';
      } else if (status === 'full') {
        bgColor = '#6b7280'; // gray
        borderColor = '#4b5563';
      }

      const isSelected = selectedCarpark?.id === cp.id;

      const markerHtml = `
        <div style="
          background-color: ${bgColor};
          color: ${textColor};
          border: 2px solid ${isSelected ? '#ffffff' : borderColor};
          border-radius: 8px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.15s ease;
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          <span>${lotInfo.available}</span>
          <span style="font-size: 9px; opacity: 0.85;">lots</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: markerHtml,
        iconSize: [58, 26],
        iconAnchor: [29, 13],
      });

      const marker = L.marker(cp.coordinates, { icon: customIcon });

      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-size: 11px; color: #a3a3a3; font-weight: 500; margin-bottom: 2px;">
            ${cp.carparkNumber} · ${cp.agency}
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #ffffff; line-height: 1.2; margin-bottom: 6px;">
            ${cp.name}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; font-family: 'JetBrains Mono', monospace;">
            <span style="font-size: 11px; color: #94a3b8;">Available:</span>
            <span style="font-size: 14px; font-weight: 800; color: ${bgColor};">${lotInfo.available} / ${lotInfo.total}</span>
          </div>
          <div style="font-size: 11px; color: #737373; margin-bottom: 8px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 4px;">
            ${cp.rates.weekdayDay.split('(')[0]}
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="inspect-btn-${cp.id}" style="
              flex: 1;
              background-color: #262626;
              color: #f5f5f5;
              border: 1px solid #404040;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 600;
              cursor: pointer;
            ">View Rates</button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${cp.coordinates[0]},${cp.coordinates[1]}" target="_blank" rel="noopener noreferrer" style="
              background-color: #10b981;
              color: #ffffff;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 600;
              text-decoration: none;
              display: flex;
              align-items: center;
              justify-content: center;
            ">Go</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`inspect-btn-${cp.id}`);
        if (btn) {
          btn.onclick = () => {
            onOpenDetails(cp);
          };
        }
      });

      markersGroup.addLayer(marker);
    });
  }, [carparks, selectedCarpark, vehicleType, onSelectCarpark, onOpenDetails]);

  // Center on selected carpark when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCarpark) return;

    map.flyTo(selectedCarpark.coordinates, 15, {
      duration: 0.8,
    });
  }, [selectedCarpark]);

  const handleJumpToRegion = (key: string) => {
    const config = REGION_BOUNDS[key];
    const map = mapInstanceRef.current;
    if (map && config) {
      map.flyTo([config.lat, config.lng], config.zoom, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-neutral-950 overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Quick Region Selector */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 p-1 bg-neutral-900/90 backdrop-blur-md rounded-lg border border-neutral-800 shadow-lg overflow-x-auto max-w-[calc(100vw-80px)]">
        <span className="text-[10px] text-neutral-400 font-medium px-1 flex items-center gap-1">
          <Compass className="w-3 h-3 text-emerald-400" />
          <span>Jump:</span>
        </span>
        {Object.keys(REGION_BOUNDS).map((regionKey) => (
          <button
            key={regionKey}
            onClick={() => handleJumpToRegion(regionKey)}
            className="px-2 py-0.5 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 rounded transition-colors whitespace-nowrap"
          >
            {regionKey}
          </button>
        ))}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-neutral-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span>&gt; 30 Lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
          <span>10 - 30 Lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span>&lt; 10 Lots</span>
        </div>
      </div>
    </div>
  );
};
