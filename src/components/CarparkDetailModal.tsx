import React from 'react';
import {
  X,
  Navigation,
  Car,
  Bike,
  Truck,
  Zap,
  Gift,
  Clock,
  CreditCard,
  ShieldAlert,
  Star,
  ExternalLink,
  Calculator,
  Compass,
} from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { getAvailabilityStatus } from '../utils/carparkUtils';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onOpenCalculator: (carpark: Carpark) => void;
  vehicleType: VehicleType;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isSaved,
  onToggleSave,
  onOpenCalculator,
  vehicleType,
}) => {
  if (!carpark) return null;

  const currentHour = new Date().getHours();
  const carStatus = getAvailabilityStatus(carpark.lots.car.available, carpark.lots.car.total);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ample':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'moderate':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'limited':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      default:
        return 'text-neutral-400 bg-neutral-900 border-neutral-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 mb-1">
              <span className="font-semibold text-emerald-400">{carpark.carparkNumber}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.carparkType}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.region}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{carpark.name}</h2>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-neutral-500" />
              <span>{carpark.address}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(carpark.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={isSaved ? 'Saved in favorites' : 'Bookmark carpark'}
            >
              <Star className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Live Lots Breakdown */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
              Real-Time Lot Availability
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Car Lots */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <Car className="w-4 h-4 text-emerald-400" />
                    <span>Cars (Class 3)</span>
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getStatusColor(carStatus)}`}>
                    {carStatus}
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {carpark.lots.car.available}
                  <span className="text-xs font-normal text-neutral-500 font-sans ml-1">
                    / {carpark.lots.car.total} lots
                  </span>
                </div>
                <div className="mt-2 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${Math.min(100, (carpark.lots.car.available / carpark.lots.car.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Motorcycle Lots */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <Bike className="w-4 h-4 text-cyan-400" />
                    <span>Motorcycles</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Class 2</span>
                </div>
                {carpark.lots.motorcycle ? (
                  <>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {carpark.lots.motorcycle.available}
                      <span className="text-xs font-normal text-neutral-500 font-sans ml-1">
                        / {carpark.lots.motorcycle.total} lots
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500"
                        style={{
                          width: `${Math.min(100, (carpark.lots.motorcycle.available / carpark.lots.motorcycle.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-500 py-3">No dedicated lots</div>
                )}
              </div>

              {/* Heavy Vehicle Lots */}
              <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span className="flex items-center gap-1.5 font-medium text-neutral-300">
                    <Truck className="w-4 h-4 text-amber-400" />
                    <span>Heavy Vehicles</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">Class 4/5</span>
                </div>
                {carpark.lots.heavy ? (
                  <>
                    <div className="text-2xl font-bold font-mono text-white tabular-nums">
                      {carpark.lots.heavy.available}
                      <span className="text-xs font-normal text-neutral-500 font-sans ml-1">
                        / {carpark.lots.heavy.total} lots
                      </span>
                    </div>
                    <div className="mt-2 w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{
                          width: `${Math.min(100, (carpark.lots.heavy.available / carpark.lots.heavy.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-500 py-3">Not permitted</div>
                )}
              </div>
            </div>
          </div>

          {/* 24-Hour Occupancy Profile */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-neutral-200">24-Hour Occupancy Trend</span>
              <span className="text-neutral-500 font-mono">Now: {currentHour}:00 ({carpark.occupancyTrend[currentHour]}% full)</span>
            </div>
            <div className="flex items-end gap-1 h-20 pt-2">
              {carpark.occupancyTrend.map((pct, hour) => {
                const isCurrent = hour === currentHour;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center h-full justify-end group/bar relative">
                    <div
                      className={`w-full rounded-t-sm transition-all ${
                        isCurrent
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-500'
                          : pct > 85
                          ? 'bg-rose-500/80 group-hover/bar:bg-rose-400'
                          : pct > 60
                          ? 'bg-amber-500/70 group-hover/bar:bg-amber-400'
                          : 'bg-neutral-700 group-hover/bar:bg-neutral-600'
                      }`}
                      style={{ height: `${Math.max(8, pct)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-7 hidden group-hover/bar:flex z-30 bg-neutral-900 border border-neutral-700 px-1.5 py-0.5 rounded text-[10px] text-white font-mono whitespace-nowrap shadow-md">
                      {hour}:00 · {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1 pt-1 border-t border-neutral-900">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>

          {/* Parking Rates Breakdown */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Published Parking Charges</span>
              </h4>
              <button
                onClick={() => onOpenCalculator(carpark)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Estimate My Fee</span>
              </button>
            </div>

            <div className="divide-y divide-neutral-800 text-xs">
              <div className="py-2 flex justify-between gap-4">
                <span className="text-neutral-400">Weekday Daytime:</span>
                <span className="text-neutral-200 text-right font-medium">{carpark.rates.weekdayDay}</span>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <span className="text-neutral-400">Weekday Night / Evening:</span>
                <span className="text-neutral-200 text-right font-medium">{carpark.rates.weekdayNight}</span>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <span className="text-neutral-400">Saturday:</span>
                <span className="text-neutral-200 text-right font-medium">{carpark.rates.saturday}</span>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <span className="text-neutral-400">Sunday & Public Holidays:</span>
                <span className={`text-right font-medium ${carpark.rates.isFreeSunday ? 'text-amber-300' : 'text-neutral-200'}`}>
                  {carpark.rates.sundayPH}
                </span>
              </div>
              <div className="py-2 flex justify-between gap-4">
                <span className="text-neutral-400">Grace Period:</span>
                <span className="text-emerald-400 text-right font-mono font-medium">
                  {carpark.rates.gracePeriodMinutes} minutes free
                </span>
              </div>
            </div>
          </div>

          {/* Practical Driver Amenities & Clearance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Height Clearance */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-neutral-300">Gantry Clearance Limit</span>
              </div>
              <div className="font-mono text-neutral-200 font-bold text-sm">
                {carpark.heightLimitMeters ? `${carpark.heightLimitMeters} metres` : 'Surface (No Height Limit)'}
              </div>
            </div>

            {/* EV Charging */}
            <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
              <div className="text-neutral-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold text-neutral-300">Electric Vehicle (EV) Chargers</span>
              </div>
              <div className="text-neutral-200">
                {carpark.evCharging.available ? (
                  <span>
                    {carpark.evCharging.provider}{' '}
                    <span className="font-mono text-cyan-300">({carpark.evCharging.portsCount} ports)</span>
                  </span>
                ) : (
                  <span className="text-neutral-500">No EV charging points</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment & Electronic Parking System (EPS) */}
          <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5 font-semibold text-neutral-300 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment Methods</span>
            </div>
            <div>{carpark.paymentMethods.join(' · ')}</div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => onOpenCalculator(carpark)}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Launch Fee Calculator</span>
          </button>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates[0]},${carpark.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
            <a
              href={`https://maps.apple.com/?daddr=${carpark.coordinates[0]},${carpark.coordinates[1]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
            >
              Apple Maps
            </a>
            <a
              href={`https://waze.com/ul?ll=${carpark.coordinates[0]},${carpark.coordinates[1]}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
            >
              Waze
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
