import React, { useState, useCallback } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaMapMarkerAlt, FaCheck, FaTimes } from 'react-icons/fa';

// Fix Leaflet default marker icon broken by bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface PickedLocation {
  address: string;
  lat: number;
  lng: number;
}

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: PickedLocation) => void;
  fieldLabel: string;
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM_REVERSE_URL}?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  const response = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  });
  if (!response.ok) throw new Error('Reverse geocoding request failed');
  const data = await response.json();
  if (data.display_name) return data.display_name;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// Tunisia center coordinates
const TUNISIA_CENTER: [number, number] = [33.8869, 9.5375];

const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, onClose, onConfirm, fieldLabel }) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
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
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setGeocodeError('Could not resolve address. Coordinates will be used as label.');
      setAddress(fallback);
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleConfirm = () => {
    if (!marker || !address || geocoding) return;
    onConfirm({ address, lat: marker.lat, lng: marker.lng });
    resetState();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setMarker(null);
    setAddress('');
    setGeocodeError('');
    setGeocoding(false);
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold d-flex align-items-center gap-2">
          <FaMapMarkerAlt className="text-danger" />
          Pick {fieldLabel} on Map
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {/* Map container */}
        <div style={{ position: 'relative' }}>
          <MapContainer
            center={TUNISIA_CENTER}
            zoom={6}
            style={{ height: '420px', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />
            {marker && <Marker position={[marker.lat, marker.lng]} />}
          </MapContainer>

          {/* Hint overlay shown before any click */}
          {!marker && (
            <div
              style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.65)',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: '20px',
                fontSize: '14px',
                pointerEvents: 'none',
                zIndex: 1000,
                whiteSpace: 'nowrap',
              }}
            >
              🖱️ Click anywhere on the map to pick a location
            </div>
          )}
        </div>

        {/* Address result panel */}
        <div className="p-3 border-top" style={{ minHeight: '64px' }}>
          {geocoding && (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner animation="border" size="sm" variant="danger" />
              <small>Resolving address…</small>
            </div>
          )}

          {geocodeError && !geocoding && (
            <Alert variant="warning" className="py-2 mb-0 small">
              {geocodeError}
            </Alert>
          )}

          {!geocoding && address && (
            <div className="d-flex align-items-start gap-2">
              <FaMapMarkerAlt className="text-danger mt-1 flex-shrink-0" />
              <div>
                <div className="fw-semibold text-dark" style={{ wordBreak: 'break-word' }}>
                  {address}
                </div>
                {marker && (
                  <small className="text-muted">
                    {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  </small>
                )}
              </div>
            </div>
          )}

          {!geocoding && !address && !geocodeError && (
            <small className="text-muted">No location selected yet — click on the map above.</small>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button
          variant="outline-secondary"
          onClick={handleClose}
          className="px-4"
          style={{ borderRadius: '10px' }}
        >
          <FaTimes className="me-1" /> Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={!marker || !address || geocoding}
          className="px-4"
          style={{ borderRadius: '10px' }}
        >
          <FaCheck className="me-1" /> Confirm Location
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MapPickerModal;
