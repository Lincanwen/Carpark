import React from 'react';
import { RefreshCw, Car, Bike, Truck, Star, MapPin, Calculator, Layers } from 'lucide-react';
import { VehicleType } from '../types/carpark';

interface HeaderProps {
  activeTab: 'map-list' | 'list' | 'saved' | 'calculator';
  setActiveTab: (tab: 'map-list' | 'list' | 'saved' | 'calculator') => void;
  vehicleType: VehicleType;
  setVehicleType: (vt: VehicleType) => void;
  savedCount: number;
  lastSyncTime: Date | null;
  dataSource: 'live-api' | 'simulated-live';
  isRefreshing: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  vehicleType,
  setVehicleType,
  savedCount,
  lastSyncTime,
  dataSource,
  isRefreshing,
  onRefresh,
}) => {
  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'Syncing...';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('map-list')}
              className="text-left group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <span className="font-bold text-sm tracking-tighter">SG</span>
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-white block leading-none font-display">
                  SG ParkWatch
                </span>
                <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
                  Real-Time Carpark Availability
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation views */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('map-list')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'map-list'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Interactive Map</span>
              <span className="sm:hidden">Map</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Browse</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Rate Calculator</span>
              <span className="md:hidden">Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved</span>
              {savedCount > 0 && (
                <span className="ml-0.5 text-xs font-mono font-bold text-amber-300">
                  ({savedCount})
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: Primary Live Status & Refresh Action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Vehicle Mode Switcher */}
            <div className="hidden lg:flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setVehicleType('car')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  vehicleType === 'car'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Class 3 Cars"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Car</span>
              </button>
              <button
                onClick={() => setVehicleType('motorcycle')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  vehicleType === 'motorcycle'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Motorcycles (Class 2)"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Bike</span>
              </button>
              <button
                onClick={() => setVehicleType('heavy')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  vehicleType === 'heavy'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Heavy Vehicles (Class 4/5)"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Heavy</span>
              </button>
            </div>

            {/* Live Data Badge */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] text-neutral-400 font-mono tabular-nums leading-tight">
                {lastSyncTime ? formatSyncTime(lastSyncTime) : 'Updating'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {dataSource === 'live-api' ? 'Data.gov.sg Live' : 'Real-Time Sync'}
              </span>
            </div>

            {/* Refresh Action Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-2 text-xs font-medium text-neutral-200 bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-neutral-700/80 rounded-lg transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title="Refresh carpark availability"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
