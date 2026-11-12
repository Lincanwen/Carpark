import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SINGAPORE_CARPARKS } from './data/singaporeCarparks';
import { Carpark, FilterOptions, VehicleType } from './types/carpark';
import { fetchLiveCarparkAvailability } from './services/dataGovService';
import { calculateDistanceKm, getLotDetailForVehicle } from './utils/carparkUtils';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { CarparkMap } from './components/CarparkMap';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import { SavedCarparksView } from './components/SavedCarparksView';
import { Car, Zap, Gift, MapPin, Activity, AlertTriangle } from 'lucide-react';

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(SINGAPORE_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [inspectingCarpark, setInspectingCarpark] = useState<Carpark | null>(null);
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);
  const [calculatorCarparkId, setCalculatorCarparkId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'map-list' | 'list' | 'saved' | 'calculator'>('map-list');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'lta-datamall' | 'data.gov.sg' | 'simulated-live'>('simulated-live');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // User Geolocation
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Saved / Starred Carparks in localStorage
  const [savedCarparkIds, setSavedCarparkIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sg_parkwatch_saved');
      return stored ? JSON.parse(stored) : ['ion-orchard', 'our-tampines-hub', 'marina-bay-sands'];
    } catch {
      return ['ion-orchard', 'our-tampines-hub'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sg_parkwatch_saved', JSON.stringify(savedCarparkIds));
    } catch {
      // ignore
    }
  }, [savedCarparkIds]);

  const toggleSaveCarpark = (id: string) => {
    setSavedCarparkIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    region: 'All',
    agency: 'All',
    vehicleType: 'car',
    onlyAvailable: false,
    onlyEV: false,
    onlyFreeSunday: false,
    onlySheltered: false,
    sortBy: 'availability',
  });

  // Sync vehicle type into filters
  useEffect(() => {
    setFilters((prev) => ({ ...prev, vehicleType }));
  }, [vehicleType]);

  // Sync data from Data.gov.sg
  const syncLiveData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetchLiveCarparkAvailability(carparks);
      setCarparks(result.updatedCarparks);
      setDataSource(result.dataSource);
      setLastSyncTime(result.lastSyncTime);
      if (result.statusMessage) {
        setStatusMessage(result.statusMessage);
      }
    } catch (e) {
      console.error('Failed to sync live carparks:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [carparks]);

  // Initial load sync and 60-second periodic polling (Singapore government API frequency)
  useEffect(() => {
    syncLiveData();

    const interval = setInterval(() => {
      syncLiveData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Geolocation handler
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setIsLocating(false);
        setFilters((prev) => ({ ...prev, sortBy: 'distance' }));
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsLocating(false);
        // Fallback default to Central Singapore (City Hall / Raffles Place)
        setUserLocation({ lat: 1.2931, lng: 103.8558 });
        setFilters((prev) => ({ ...prev, sortBy: 'distance' }));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const getDistanceForCarpark = useCallback(
    (lat: number, lng: number): number | null => {
      if (!userLocation) return null;
      return calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
    },
    [userLocation]
  );

  // Filter and sort carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Search query (name, carparkNumber, address, postalCode)
        if (filters.searchQuery.trim() !== '') {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchCode = cp.carparkNumber.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchPostal = cp.postalCode.includes(q);
          if (!matchName && !matchCode && !matchAddress && !matchPostal) {
            return false;
          }
        }

        // Region filter
        if (filters.region !== 'All' && cp.region !== filters.region) {
          return false;
        }

        // Agency filter
        if (filters.agency !== 'All' && cp.agency !== filters.agency) {
          return false;
        }

        const lotInfo = getLotDetailForVehicle(cp, vehicleType);

        // Available only
        if (filters.onlyAvailable && lotInfo.available <= 10) {
          return false;
        }

        // EV only
        if (filters.onlyEV && !cp.evCharging.available) {
          return false;
        }

        // Free Sunday
        if (filters.onlyFreeSunday && !cp.rates.isFreeSunday) {
          return false;
        }

        // Sheltered / Multi-Storey
        if (
          filters.onlySheltered &&
          cp.carparkType !== 'Multi-Storey (MSCP)' &&
          cp.carparkType !== 'Basement'
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const lotA = getLotDetailForVehicle(a, vehicleType);
        const lotB = getLotDetailForVehicle(b, vehicleType);

        if (filters.sortBy === 'availability') {
          return lotB.available - lotA.available;
        }

        if (filters.sortBy === 'distance' && userLocation) {
          const distA = calculateDistanceKm(userLocation.lat, userLocation.lng, a.coordinates[0], a.coordinates[1]);
          const distB = calculateDistanceKm(userLocation.lat, userLocation.lng, b.coordinates[0], b.coordinates[1]);
          return distA - distB;
        }

        if (filters.sortBy === 'rate') {
          // Central area or higher rate
          const rateA = a.rates.centralAreaPricing ? 1.2 : 0.6;
          const rateB = b.rates.centralAreaPricing ? 1.2 : 0.6;
          return rateA - rateB;
        }

        if (filters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
  }, [carparks, filters, vehicleType, userLocation]);

  // Aggregate Island-Wide Metrics
  const islandStats = useMemo(() => {
    let totalLots = 0;
    let availableLots = 0;
    let evCount = 0;
    let freeSundayCount = 0;

    carparks.forEach((cp) => {
      const lot = getLotDetailForVehicle(cp, vehicleType);
      totalLots += lot.total;
      availableLots += lot.available;
      if (cp.evCharging.available) evCount++;
      if (cp.rates.isFreeSunday) freeSundayCount++;
    });

    const occupancyRate = totalLots > 0 ? Math.round(((totalLots - availableLots) / totalLots) * 100) : 0;

    return {
      totalCarparks: carparks.length,
      totalLots,
      availableLots,
      occupancyRate,
      evCount,
      freeSundayCount,
    };
  }, [carparks, vehicleType]);

  const handleOpenCalculator = (carpark: Carpark) => {
    setCalculatorCarparkId(carpark.id);
    setShowCalculatorModal(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        savedCount={savedCarparkIds.length}
        lastSyncTime={lastSyncTime}
        dataSource={dataSource}
        isRefreshing={isRefreshing}
        onRefresh={syncLiveData}
      />

      {/* Main Content Areas */}
      <main className="flex-1 flex flex-col">
        {/* STATS STRIP (Clean editorial dashboard metrics with tabular figures) */}
        <section className="bg-neutral-900/60 border-b border-neutral-800/80 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Total Monitored:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {islandStats.totalCarparks} locations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Available ({vehicleType}):</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  {islandStats.availableLots.toLocaleString()} / {islandStats.totalLots.toLocaleString()} lots
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Island-wide Occupancy:</span>
                <span className="font-mono font-bold text-neutral-200 tabular-nums">
                  {islandStats.occupancyRate}%
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-neutral-400">EV Hubs:</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {islandStats.evCount} carparks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{statusMessage || 'LTA DataMall & Data.gov.sg Active'}</span>
            </div>
          </div>
        </section>

        {/* TAB 1: SPLIT MAP & LIST VIEW */}
        {activeTab === 'map-list' && (
          <div className="flex-1 flex flex-col">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalMatches={filteredCarparks.length}
              totalAvailableLots={filteredCarparks.reduce(
                (sum, cp) => sum + getLotDetailForVehicle(cp, vehicleType).available,
                0
              )}
              hasUserLocation={userLocation !== null}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
            />

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-230px)]">
              {/* Left Column: Scrollable List of Carparks (5 columns on desktop) */}
              <div className="lg:col-span-5 border-r border-neutral-800 bg-neutral-950/90 overflow-y-auto max-h-[calc(100vh-230px)] p-4 space-y-3">
                {filteredCarparks.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-900 rounded-xl border border-neutral-800 my-8">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-white mb-1">
                      No matching carparks found
                    </h4>
                    <p className="text-xs text-neutral-400">
                      Try clearing search keywords or relaxing your feature filters.
                    </p>
                  </div>
                ) : (
                  filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      vehicleType={vehicleType}
                      isSelected={selectedCarpark?.id === cp.id}
                      isSaved={savedCarparkIds.includes(cp.id)}
                      onSelect={(carpark) => setSelectedCarpark(carpark)}
                      onOpenDetails={(carpark) => setInspectingCarpark(carpark)}
                      onToggleSave={toggleSaveCarpark}
                      userDistanceKm={getDistanceForCarpark(cp.coordinates[0], cp.coordinates[1])}
                    />
                  ))
                )}
              </div>

              {/* Right Column: Interactive Full-Height Map (7 columns on desktop) */}
              <div className="lg:col-span-7 h-[460px] lg:h-full sticky top-[64px]">
                <CarparkMap
                  carparks={filteredCarparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={(carpark) => setSelectedCarpark(carpark)}
                  onOpenDetails={(carpark) => setInspectingCarpark(carpark)}
                  vehicleType={vehicleType}
                  userLocation={userLocation}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BROWSE GRID VIEW */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              totalMatches={filteredCarparks.length}
              totalAvailableLots={filteredCarparks.reduce(
                (sum, cp) => sum + getLotDetailForVehicle(cp, vehicleType).available,
                0
              )}
              hasUserLocation={userLocation !== null}
              onLocateMe={handleLocateMe}
              isLocating={isLocating}
            />

            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
              {filteredCarparks.length === 0 ? (
                <div className="p-12 text-center bg-neutral-900 rounded-xl border border-neutral-800 max-w-md mx-auto">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h4 className="text-base font-semibold text-white mb-1">No Carparks Matched</h4>
                  <p className="text-xs text-neutral-400">
                    No carparks found matching your criteria. Adjust your search or clear filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCarparks.map((cp) => (
                    <CarparkCard
                      key={cp.id}
                      carpark={cp}
                      vehicleType={vehicleType}
                      isSelected={selectedCarpark?.id === cp.id}
                      isSaved={savedCarparkIds.includes(cp.id)}
                      onSelect={(carpark) => setSelectedCarpark(carpark)}
                      onOpenDetails={(carpark) => setInspectingCarpark(carpark)}
                      onToggleSave={toggleSaveCarpark}
                      userDistanceKm={getDistanceForCarpark(cp.coordinates[0], cp.coordinates[1])}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STANDALONE RATE CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <RateCalculatorModal
              carparks={carparks}
              initialCarparkId={selectedCarpark?.id}
              isStandalone={true}
            />
          </div>
        )}

        {/* TAB 4: SAVED CARPARKS */}
        {activeTab === 'saved' && (
          <SavedCarparksView
            savedCarparkIds={savedCarparkIds}
            allCarparks={carparks}
            vehicleType={vehicleType}
            selectedCarpark={selectedCarpark}
            onSelectCarpark={(cp) => setSelectedCarpark(cp)}
            onOpenDetails={(cp) => setInspectingCarpark(cp)}
            onToggleSave={toggleSaveCarpark}
            onBrowseAll={() => setActiveTab('map-list')}
            userLocation={userLocation}
            calculateDistance={getDistanceForCarpark}
          />
        )}
      </main>

      {/* Detail Inspection Modal */}
      <CarparkDetailModal
        carpark={inspectingCarpark}
        onClose={() => setInspectingCarpark(null)}
        isSaved={inspectingCarpark ? savedCarparkIds.includes(inspectingCarpark.id) : false}
        onToggleSave={toggleSaveCarpark}
        onOpenCalculator={handleOpenCalculator}
        vehicleType={vehicleType}
      />

      {/* Floating Rate Calculator Modal (when launched from detail card) */}
      {showCalculatorModal && (
        <RateCalculatorModal
          carparks={carparks}
          initialCarparkId={calculatorCarparkId}
          onClose={() => setShowCalculatorModal(false)}
        />
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-4 sm:px-6 lg:px-8 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            SG ParkWatch · Singapore Real-Time Carpark Availability & Rates
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>HDB Electronic Parking (EPS)</span>
            <span>·</span>
            <span>URA & Shopping Malls</span>
            <span>·</span>
            <span>Data.gov.sg Open Data</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
