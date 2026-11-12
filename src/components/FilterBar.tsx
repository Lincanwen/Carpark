import React from 'react';
import { Search, X, SlidersHorizontal, Zap, Gift, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { FilterOptions, Region, Agency, VehicleType } from '../types/carpark';

interface FilterBarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  totalMatches: number;
  totalAvailableLots: number;
  hasUserLocation: boolean;
  onLocateMe: () => void;
  isLocating: boolean;
}

const REGIONS: Array<'All' | Region> = [
  'All',
  'Central / CBD',
  'East',
  'West',
  'North',
  'North-East',
];

const AGENCIES: Array<'All' | Agency> = [
  'All',
  'HDB',
  'URA',
  'Commercial / Mall',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  totalMatches,
  totalAvailableLots,
  hasUserLocation,
  onLocateMe,
  isLocating,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.region !== 'All' ||
    filters.agency !== 'All' ||
    filters.onlyAvailable ||
    filters.onlyEV ||
    filters.onlyFreeSunday ||
    filters.onlySheltered;

  const handleReset = () => {
    setFilters({
      searchQuery: '',
      region: 'All',
      agency: 'All',
      vehicleType: filters.vehicleType,
      onlyAvailable: false,
      onlyEV: false,
      onlyFreeSunday: false,
      onlySheltered: false,
      sortBy: 'availability',
    });
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 p-4 space-y-3">
      {/* Search & Sort Row */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            placeholder="Search by carpark name, code (e.g. ACB, TM39), street, or 6-digit postal code..."
            className="w-full pl-10 pr-9 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Geolocation Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400 hidden sm:inline">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  sortBy: e.target.value as FilterOptions['sortBy'],
                }))
              }
              className="bg-transparent text-neutral-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="availability" className="bg-neutral-900">
                Most Available Lots
              </option>
              <option value="distance" className="bg-neutral-900" disabled={!hasUserLocation}>
                Nearest Distance {!hasUserLocation ? '(Enable GPS)' : ''}
              </option>
              <option value="rate" className="bg-neutral-900">
                Lowest Base Rate
              </option>
              <option value="name" className="bg-neutral-900">
                Carpark Name (A-Z)
              </option>
            </select>
          </div>

          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              hasUserLocation
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Use your device GPS to sort carparks by proximity"
          >
            <span className={`w-2 h-2 rounded-full ${hasUserLocation ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
            <span>{isLocating ? 'Locating...' : hasUserLocation ? 'Near Me' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Region & Agency Segmented Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Regions */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800 overflow-x-auto max-w-full">
          {REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => setFilters((prev) => ({ ...prev, region }))}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filters.region === region
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Agency Select */}
        <div className="flex items-center gap-1 p-0.5 bg-neutral-950 rounded-lg border border-neutral-800">
          {AGENCIES.map((agency) => (
            <button
              key={agency}
              onClick={() => setFilters((prev) => ({ ...prev, agency }))}
              className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filters.agency === agency
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {agency}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Toggles & Results Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyAvailable: !prev.onlyAvailable }))
            }
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              filters.onlyAvailable
                ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Lots &gt; 10</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyEV: !prev.onlyEV }))
            }
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              filters.onlyEV
                ? 'bg-cyan-950/70 border-cyan-700/80 text-cyan-300'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>EV Charging</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlyFreeSunday: !prev.onlyFreeSunday }))
            }
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              filters.onlyFreeSunday
                ? 'bg-amber-950/70 border-amber-700/80 text-amber-300'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gift className="w-3 h-3 text-amber-400" />
            <span>Free Sunday Parking</span>
          </button>

          <button
            onClick={() =>
              setFilters((prev) => ({ ...prev, onlySheltered: !prev.onlySheltered }))
            }
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
              filters.onlySheltered
                ? 'bg-purple-950/70 border-purple-700/80 text-purple-300'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-purple-400" />
            <span>Sheltered / MSCP</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-neutral-400 hover:text-neutral-200 underline ml-1"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Live Summary Text (Anti-pill unboxed text with separators) */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono tabular-nums">
          <span>{totalMatches} carparks shown</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-400 font-semibold">{totalAvailableLots.toLocaleString()} lots free</span>
        </div>
      </div>
    </div>
  );
};
