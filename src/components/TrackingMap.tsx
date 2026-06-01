import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useSocket } from '../hooks/useSocket';

export default function TrackingMap({ pickup, dest, orderId }: { pickup: [number, number], dest: [number, number], orderId: string }) {
  const [courierPos, setCourierPos] = useState<[number, number] | null>(null);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on("courier:position", (data: { lat: number, lng: number }) => {
      // In a real app we'd filter by orderId if we track multiple, but sender tracks their active one
      setCourierPos([data.lat, data.lng]);
    });

    return () => {
      socket.off("courier:position");
    }
  }, [socket]);

  // Use simple bounds to fit everything
  const bounds = L.latLngBounds([pickup, dest]);
  if (courierPos) bounds.extend(courierPos);

  const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
  });

  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41]
  });

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 relative">
      <MapContainer bounds={bounds} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={[pickup, dest]} color="gray" dashArray="5,5" />
        
        <Marker position={pickup} icon={greenIcon} />
        <Marker position={dest} icon={redIcon} />
        
        {courierPos && (
          <Marker position={courierPos} />
        )}
      </MapContainer>
    </div>
  );
}
