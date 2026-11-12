import React, { useState } from 'react';
import { Calculator, Clock, Calendar, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { Carpark } from '../types/carpark';
import { calculateEstimatedFee } from '../utils/carparkUtils';

interface RateCalculatorModalProps {
  carparks: Carpark[];
  initialCarparkId?: string;
  onClose?: () => void;
  isStandalone?: boolean;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  carparks,
  initialCarparkId,
  onClose,
  isStandalone = false,
}) => {
  const [selectedCarparkId, setSelectedCarparkId] = useState<string>(
    initialCarparkId || carparks[0]?.id || ''
  );
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [startHour, setStartHour] = useState<number>(12);
  const [startMinute, setStartMinute] = useState<number>(30);
  const [durationMinutes, setDurationMinutes] = useState<number>(120); // 2 hours default

  const currentCarpark = carparks.find((c) => c.id === selectedCarparkId) || carparks[0];

  const result = currentCarpark
    ? calculateEstimatedFee(currentCarpark, dayType, startHour, startMinute, durationMinutes)
    : { totalFee: 0, breakdown: [], isGracePeriod: false };

  const formatDurationText = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} mins`;
    if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
    return `${h} hr ${m} mins`;
  };

  const endTotalMinutes = startHour * 60 + startMinute + durationMinutes;
  const endHour = Math.floor(endTotalMinutes / 60) % 24;
  const endMinute = endTotalMinutes % 60;
  const isNextDay = Math.floor(endTotalMinutes / 60) >= 24;

  const content = (
    <div className="space-y-6">
      {/* Title bar */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>Singapore Parking Fee Estimator</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Calculate accurate charges for HDB, URA, and shopping mall carparks based on entry time, duration, and peak rules.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Inputs Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Carpark Selector */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-neutral-300">
            Selected Carpark:
          </label>
          <select
            value={selectedCarparkId}
            onChange={(e) => setSelectedCarparkId(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-neutral-700"
          >
            {carparks.map((cp) => (
              <option key={cp.id} value={cp.id}>
                {cp.carparkNumber} - {cp.name} ({cp.agency} · {cp.region})
              </option>
            ))}
          </select>
        </div>

        {/* Day of Week */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Day Type:</span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              type="button"
              onClick={() => setDayType('weekday')}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                dayType === 'weekday'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Mon - Fri
            </button>
            <button
              type="button"
              onClick={() => setDayType('saturday')}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                dayType === 'saturday'
                  ? 'bg-neutral-800 text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Saturday
            </button>
            <button
              type="button"
              onClick={() => setDayType('sunday')}
              className={`py-1.5 text-xs font-medium rounded transition-colors ${
                dayType === 'sunday'
                  ? 'bg-neutral-800 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sun / PH
            </button>
          </div>
        </div>

        {/* Entry Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Entry Time:</span>
          </label>
          <div className="flex items-center gap-2">
            <select
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
              className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono focus:outline-none"
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00 {i >= 12 ? 'PM' : 'AM'}
                </option>
              ))}
            </select>
            <span className="text-neutral-500 font-bold">:</span>
            <select
              value={startMinute}
              onChange={(e) => setStartMinute(parseInt(e.target.value, 10))}
              className="w-20 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-sm text-neutral-100 font-mono focus:outline-none"
            >
              <option value={0}>00</option>
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={45}>45</option>
            </select>
          </div>
        </div>

        {/* Stay Duration Presets & Slider */}
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">
              Estimated Duration: {formatDurationText(durationMinutes)}
            </span>
            <span className="text-neutral-400 font-mono">
              Exit: {endHour.toString().padStart(2, '0')}:{endMinute.toString().padStart(2, '0')}
              {isNextDay ? ' (+1 day)' : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[15, 30, 60, 90, 120, 180, 240, 360, 480].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                className={`px-3 py-1 text-xs rounded-lg border font-mono transition-colors ${
                  durationMinutes === mins
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300 font-bold'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {formatDurationText(mins)}
              </button>
            ))}
          </div>

          <input
            type="range"
            min={10}
            max={720}
            step={10}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer mt-1"
          />
        </div>
      </div>

      {/* Output Result Card */}
      <div className="p-5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-neutral-400 uppercase tracking-wider block font-medium">
              Estimated Total Parking Fee
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-white mt-1">
              ${result.totalFee.toFixed(2)}{' '}
              <span className="text-sm font-normal text-neutral-400 font-sans">SGD</span>
            </div>
          </div>

          <div className="text-right">
            {result.isGracePeriod ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Grace Period (Free)</span>
              </span>
            ) : dayType === 'sunday' && currentCarpark?.rates.isFreeSunday ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sunday Free Scheme</span>
              </span>
            ) : (
              <span className="text-xs text-neutral-400 font-mono">
                EPS Electronic Billing
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-1.5 pt-3 border-t border-neutral-800/80 text-xs">
          <span className="text-neutral-400 font-medium block">Calculation Details:</span>
          {result.breakdown.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-neutral-300 font-mono">
              <ArrowRight className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
          <div className="text-[11px] text-neutral-500 pt-1">
            * Rate based on published tariff: {currentCarpark?.rates.weekdayDay}
          </div>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
};
