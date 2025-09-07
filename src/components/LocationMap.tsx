import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

const LocationMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [token, setToken] = useState('');
  const [mapInitialized, setMapInitialized] = useState(false);

  // Gym coordinates for Pje. Ur Zaleak de, 2, 20012 Donostia-San Sebastián
  const gymCoordinates: [number, number] = [-1.9812, 43.3183]; // Donostia coordinates

  const initializeMap = () => {
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: gymCoordinates,
      zoom: 16
    });

    // Add marker for gym location
    new mapboxgl.Marker({
      color: '#dc2626' // Boxing red color
    })
    .setLngLat(gymCoordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">EgiaK.O. Boxeo elkartea</h3>
            <p class="text-xs text-gray-600">Pje. Ur Zaleak de, 2<br>20012 Donostia-San Sebastián</p>
          </div>
        `)
    )
    .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    setMapInitialized(true);
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  if (!mapInitialized) {
    return (
      <div className="space-y-4">
        <h4 className="font-oswald font-semibold text-lg mb-4">Ubicación</h4>
        <div className="bg-boxing-grey/20 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-boxing-red" />
            <span>Pje. Ur Zaleak de, 2, 20012 Donostia-San Sebastián</span>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Introduce tu Mapbox Public Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="text-sm"
            />
            <Button 
              onClick={initializeMap}
              disabled={!token}
              size="sm"
              className="w-full"
            >
              Mostrar mapa
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Obtén tu token gratuito en{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-boxing-red hover:underline">
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="font-oswald font-semibold text-lg mb-4">Ubicación</h4>
      <div ref={mapContainer} className="h-32 rounded-lg shadow-lg" />
    </div>
  );
};

export default LocationMap;