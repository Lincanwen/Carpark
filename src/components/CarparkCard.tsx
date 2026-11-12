import React from 'react';
import { Star, Navigation, Zap, Gift, ShieldAlert, ArrowUpRight, Clock } from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityStatus, getLotDetailForVehicle } from '../utils/carparkUtils';

interface CarparkCardProps {
  carpark: Carpark;
  vehicleType: VehicleType;
  isSelected: boolean;
  isSaved: boolean;
  onSelect: (cp: Carpark) => void;
  onOpenDetails: (cp: Carpark) => void;
  onToggleSave: (cpId: string) => void;
  userDistanceKm?: number | null;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  vehicleType,
  isSelected,
  isSaved,
  onSelect,
  onOpenDetails,
  onToggleSave,
  userDistanceKm,
}) => {
  const lotInfo = getLotDetailForVehicle(carpark, vehicleType);
  const status = getAvailabilityStatus(lotInfo.available, lotInfo.total);
  const occupancyPct = Math.round(((lotInfo.total - lotInfo.available) / lotInfo.total) * 100);

  // Status styling
  let statusColorText = 'text-emerald-400';
  let statusBgBar = 'bg-emerald-500';
  let statusLabel = 'Ample';

  if (status === 'limited') {
    statusColorText = 'text-rose-400';
    statusBgBar = 'bg-rose-500';
    statusLabel = 'Crowded';
  } else if (status === 'moderate') {
    statusColorText = 'text-amber-400';
    statusBgBar = 'bg-amber-500';
    statusLabel = 'Filling Fast';
  } else if (status === 'full') {
    statusColorText = 'text-neutral-400';
    statusBgBar = 'bg-neutral-600';
    statusLabel = 'Full';
  }

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates[0]},${carpark.coordinates[1]}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave(carpark.id);
  };

  return (
    <div
      onClick={() => onSelect(carpark)}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer bg-neutral-900/80 hover:bg-neutral-900 ${
        isSelected
          ? 'border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-md shadow-emerald-950/20'
          : 'border-neutral-800 hover:border-neutral-700'
      }`}
    >
      {/* Top Row: Unboxed clean metadata & Save button */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          {/* Metadata line without pills (§1.A Zero-Pill rule) */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1 font-mono">
            <span className="font-semibold text-neutral-300">{carpark.carparkNumber}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{carpark.region}</span>
            {userDistanceKm != null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-bold">{userDistanceKm} km</span>
              </>
            )}
          </div>

          <h3 className="text-base font-semibold text-white tracking-tight leading-snug group-hover:text-emerald-300 transition-colors truncate">
            {carpark.name}
          </h3>
          <p className="text-xs text-neutral-400 truncate mt-0.5">{carpark.address}</p>
        </div>

        {/* Favorite Bookmark Button */}
        <button
          onClick={handleSave}
          className={`p-2 rounded-lg border transition-colors shrink-0 ${
            isSaved
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
          }`}
          title={isSaved ? 'Remove from saved' : 'Save carpark'}
        >
          <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Lot Availability Metrics Row */}
      <div className="my-3 p-3 bg-neutral-950 rounded-lg border border-neutral-800/80">
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
              {lotInfo.available}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {lotInfo.total} lots available
            </span>
          </div>

          <div className="text-right">
            <span className={`text-xs font-semibold ${statusColorText}`}>
              {statusLabel}
            </span>
            <span className="text-[11px] text-neutral-500 font-mono block">
              {occupancyPct}% occupied
            </span>
          </div>
        </div>

        {/* Progress Capacity Bar */}
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusBgBar} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(4, (lotInfo.available / lotInfo.total) * 100))}%` }}
          />
        </div>
      </div>

      {/* Rate Kicker and Amenities (Clean unboxed inline text) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
        <div className="flex items-center gap-1 text-neutral-300">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span className="truncate max-w-[220px]">{carpark.rates.weekdayDay.split('(')[0].trim()}</span>
        </div>

        {carpark.evCharging.available && (
          <div className="flex items-center gap-1 text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>EV Charger</span>
          </div>
        )}

        {carpark.rates.isFreeSunday && (
          <div className="flex items-center gap-1 text-amber-300">
            <Gift className="w-3.5 h-3.5" />
            <span>Free Sun</span>
          </div>
        )}

        {carpark.heightLimitMeters && (
          <div className="text-neutral-400 font-mono">
            <span>Ht: {carpark.heightLimitMeters}m</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="flex items-center gap-2 mt-3 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(carpark);
          }}
          className="flex-1 py-1.5 px-3 text-xs font-medium text-neutral-200 bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Rate Card & Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDirections}
          className="py-1.5 px-3 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-lg transition-colors flex items-center gap-1.5"
          title="Open Google Maps turn-by-turn directions"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions</span>
        </button>
      </div>
    </div>
  );
};
