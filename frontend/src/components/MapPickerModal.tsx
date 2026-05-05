import React, { useState, useCallback } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { FaMapMarkerAlt, FaCheck, FaTimes, FaSearchLocation } from 'react-icons/fa';

// Fix default Leaflet marker icons (same pattern used in TripDetails.tsx)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface PickedLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface MapPickerModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (location: PickedLocation) => void;
  fieldLabel: string;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!response.ok) throw new Error('Geocoding request failed');
    const data = await response.json();
    if (data?.display_name) {
      return data.display_name as string;
    }
    return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

// Inner component that captures map click events via the useMapEvents hook
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({
  onMapClick,
}) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const TUNISIA_CENTER: [number, number] = [33.8869, 9.5375];

const MapPickerModal: React.FC<MapPickerModalProps> = ({ show, onHide, onConfirm, fieldLabel }) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarker({ lat, lng });
    setAddress('');
    setGeocodeError('');
    setGeocoding(true);
    try {
      const resolved = await reverseGeocode(lat, lng);
      setAddress(resolved);
    } catch {
      setGeocodeError('Could not resolve address. You can still confirm the location.');
      setAddress(`Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleConfirm = () => {
    if (!marker) return;
    onConfirm({
      address: address || `Location at ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}`,
      lat: marker.lat,
      lng: marker.lng,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setMarker(null);
    setAddress('');
    setGeocodeError('');
    setGeocoding(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={resetAndClose} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <FaMapMarkerAlt className="text-danger" />
          Pick {fieldLabel} on Map
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          Click anywhere on the map to place a marker. The address will be resolved automatically.
        </p>

        {/* Map container — conditionally rendered so Leaflet gets the correct dimensions */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', border: '2px solid #dee2e6' }}>
          {show && (
            <MapContainer
              center={TUNISIA_CENTER}
              zoom={7}
              style={{ height: '400px', width: '100%', cursor: 'crosshair' }}
              scrollWheelZoom
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {marker && <Marker position={[marker.lat, marker.lng]} />}
            </MapContainer>
          )}
        </div>

        {/* Resolved address display */}
        <div
          className="mt-3 p-3"
          style={{ background: '#f8f9fa', borderRadius: '10px', minHeight: '60px' }}
        >
          {!marker && !geocoding && (
            <p className="text-muted mb-0 d-flex align-items-center gap-2">
              <FaSearchLocation className="text-secondary" />
              Click on the map to pick a location
            </p>
          )}
          {geocoding && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" variant="danger" />
              <span className="text-muted">Resolving address…</span>
            </div>
          )}
          {!geocoding && address && (
            <div className="d-flex align-items-start gap-2">
              <FaMapMarkerAlt className="text-danger mt-1 flex-shrink-0" />
              <div>
                <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                  {address}
                </div>
                {marker && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  </div>
                )}
              </div>
            </div>
          )}
          {geocodeError && !geocoding && (
            <Alert variant="warning" className="mb-0 py-2" style={{ fontSize: '0.85rem' }}>
              {geocodeError}
            </Alert>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="outline-secondary" onClick={resetAndClose} style={{ borderRadius: '10px' }}>
          <FaTimes className="me-1" /> Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!marker || geocoding}
          style={{ borderRadius: '10px' }}
        >
          <FaCheck className="me-1" /> Confirm Location
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MapPickerModal;
