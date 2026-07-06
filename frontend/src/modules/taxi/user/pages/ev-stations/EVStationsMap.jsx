import React, { useEffect, useState, useRef, useMemo } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { 
  ArrowLeft, 
  MapPin, 
  Zap, 
  BatteryCharging, 
  Search, 
  Navigation, 
  RefreshCw, 
  Info,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppGoogleMapsLoader, HAS_VALID_GOOGLE_MAPS_KEY } from '../../../admin/utils/googleMaps';
import { getClosestEVStations } from '../../services/evStationService';
import evStationImg from '@/assets/3d images/AutoCab/ev_station.png';

const EVStationsMap = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapRef, setMapRef] = useState(null);
  const mapWrapperRef = useRef(null);

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useAppGoogleMapsLoader();

  useEffect(() => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;

    const handleTouchStart = (e) => {
      e.stopPropagation();
    };

    const handleTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    // Use passive: false to allow calling preventDefault inside touch event listener
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchStart, { passive: false });

    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchStart);
    };
  }, []);

  const fetchStations = async (lat, lng) => {
    try {
      setLoading(true);
      const data = await getClosestEVStations(lat, lng);
      setStations(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load charging stations.');
    } finally {
      setLoading(false);
    }
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      fetchStations(22.7196, 75.8577); // Indore fallback
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        setUserCoords(coords);
        fetchStations(latitude, longitude);
        if (mapRef) {
          mapRef.panTo(coords);
        }
      },
      (error) => {
        console.warn('Geolocation access denied. Using default coordinates.');
        toast.success('Showing default EV Stations');
        const fallbackCoords = { lat: 22.7196, lng: 75.8577 }; // Indore center
        setUserCoords(fallbackCoords);
        fetchStations(fallbackCoords.lat, fallbackCoords.lng);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    locateUser();
  }, []);

  const filteredStations = useMemo(() => {
    return stations.filter((s) =>
      [s.name, s.address, s.pricing].join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stations, searchQuery]);

  const handleStationClick = (station) => {
    setSelectedStation(station);
    if (mapRef) {
      mapRef.panTo({ lat: station.latitude, lng: station.longitude });
      mapRef.setZoom(15);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 animate-in fade-in duration-300">
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100/80 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/taxi/home')}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              <BatteryCharging size={22} className="text-blue-600 animate-pulse" />
              EV Charging Network
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Find charging stations near you</p>
          </div>
        </div>

        <button 
          onClick={locateUser} 
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider active:scale-95 shadow-2xs hover:shadow-xs"
          title="Refresh location"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Scan Nearby
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Sidebar list (left side on desktop, bottom/hidden on mobile) */}
        <div className="w-full md:w-96 bg-white border-r border-slate-100 flex flex-col h-1/2 md:h-full z-10 shadow-lg md:shadow-none">
          
          {/* Search bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search stations, address, pricing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:shadow-xs"
              />
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <RefreshCw className="animate-spin text-blue-500" size={28} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Locating nearest chargers...</span>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold uppercase tracking-wider">
                No charging points found
              </div>
            ) : (
              filteredStations.map((station) => {
                const isSelected = selectedStation?.id === station.id;
                const percentFree = (station.stallsAvailable / station.stallsTotal) * 100;
                const isAvailable = station.stallsAvailable > 0;

                return (
                  <div
                    key={station.id}
                    onClick={() => handleStationClick(station)}
                    className={`rounded-2xl p-4 border transition-all duration-300 cursor-pointer text-left flex flex-col gap-3.5 relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-50/70 to-indigo-50/30 border-blue-500/30 shadow-xs border-l-4 border-l-blue-600 scale-[1.01]'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:scale-[1.005] hover:shadow-2xs border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{station.name}</h4>
                        </div>
                        <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{station.address}</span>
                        </p>
                      </div>
                      <span className="bg-blue-50/80 text-blue-700 rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wide shrink-0 border border-blue-100/50">
                        {station.powerKW} kW
                      </span>
                    </div>

                    {/* Stalls Capacity Bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                        <span>Availability</span>
                        <span className={isAvailable ? 'text-emerald-600' : 'text-rose-600'}>
                          {station.stallsAvailable} / {station.stallsTotal} stalls free
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isAvailable ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${percentFree}%` }}
                        />
                      </div>
                    </div>

                    {/* Connector & Price Badges */}
                    <div className="pt-3 border-t border-slate-100/80 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                      <div className="flex flex-wrap gap-1">
                        {station.connectorTypes?.slice(0, 2).map((type) => (
                          <span key={type} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[9px] font-semibold">
                            {type}
                          </span>
                        ))}
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 rounded-lg px-2 py-0.5 border border-emerald-100/60 font-extrabold">
                        {station.pricing}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map View */}
        <div 
          ref={mapWrapperRef}
          className="flex-1 h-1/2 md:h-full relative bg-slate-100 touch-none"
        >
          {!HAS_VALID_GOOGLE_MAPS_KEY ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-100">
              <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <AlertTriangle className="text-amber-500" size={24} />
              </div>
              <p className="text-sm font-extrabold text-slate-900">Map Interface Unavailable</p>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-normal">
                Google Maps key is not configured. Please use the sidebar list to browse the EV charging locations.
              </p>
            </div>
          ) : mapLoadError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-slate-100">
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <AlertTriangle className="text-rose-500" size={24} />
              </div>
              <p className="text-sm font-extrabold text-slate-900">Maps Failed to Load</p>
              <p className="text-xs text-slate-500 mt-2 max-w-xs leading-normal">
                An error occurred while initializing Google Maps API.
              </p>
            </div>
          ) : isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%', touchAction: 'none' }}
              center={
                selectedStation 
                  ? { lat: selectedStation.latitude, lng: selectedStation.longitude }
                  : userCoords || { lat: 22.7196, lng: 75.8577 }
              }
              zoom={13}
              onLoad={(map) => setMapRef(map)}
              options={{
                streetViewControl: false,
                mapTypeControl: true,
                fullscreenControl: true,
                gestureHandling: 'greedy',
              }}
            >
              {/* User location pin */}
              {userCoords && window.google?.maps && (
                <MarkerF
                  position={userCoords}
                  title="Your Location"
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#3b82f6', // Premium blue color
                    fillOpacity: 0.9,
                    strokeColor: '#ffffff',
                    strokeWeight: 2.5,
                    scale: 7, // Size of the location dot
                  }}
                />
              )}

              {/* Station markers */}
              {filteredStations.map((station) => (
                <MarkerF
                  key={station.id}
                  position={{ lat: station.latitude, lng: station.longitude }}
                  title={station.name}
                  onClick={() => setSelectedStation(station)}
                  icon={{
                    url: evStationImg,
                    scaledSize: new window.google.maps.Size(42, 42),
                    origin: new window.google.maps.Point(0, 0),
                    anchor: new window.google.maps.Point(21, 21),
                  }}
                />
              ))}

              {/* Info Window */}
              {selectedStation && (
                <InfoWindowF
                  position={{ lat: selectedStation.latitude, lng: selectedStation.longitude }}
                  onCloseClick={() => setSelectedStation(null)}
                >
                  <div className="p-3 max-w-xs text-left flex flex-col gap-2.5">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{selectedStation.name}</h3>
                      <p className="text-slate-500 text-xs mt-1 leading-normal flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400 shrink-0" />
                        <span>{selectedStation.address}</span>
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100/50">
                        {selectedStation.powerKW} kW
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100/50">
                        {selectedStation.stallsAvailable} / {selectedStation.stallsTotal} Free
                      </span>
                    </div>

                    {selectedStation.connectorTypes && (
                      <div className="flex flex-wrap gap-1">
                        {selectedStation.connectorTypes.map((type) => (
                          <span key={type} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-[9px] font-bold">
                            {type}
                          </span>
                        ))}
                      </div>
                    )}

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedStation.latitude},${selectedStation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white font-bold uppercase text-[10px] tracking-wider py-2 shadow-sm hover:bg-blue-700 active:scale-98 transition-all"
                    >
                      <Navigation size={10} /> Get Directions
                    </a>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
              Initializing Maps...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EVStationsMap;
