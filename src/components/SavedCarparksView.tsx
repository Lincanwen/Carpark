import React from 'react';
import { Star, MapPin, Compass, Navigation } from 'lucide-react';
import { Carpark, VehicleType } from '../types/carpark';
import { CarparkCard } from './CarparkCard';

interface SavedCarparksViewProps {
  savedCarparkIds: string[];
  allCarparks: Carpark[];
  vehicleType: VehicleType;
  selectedCarpark: Carpark | null;
  onSelectCarpark: (cp: Carpark) => void;
  onOpenDetails: (cp: Carpark) => void;
  onToggleSave: (id: string) => void;
  onBrowseAll: () => void;
  userLocation: { lat: number; lng: number } | null;
  calculateDistance: (lat: number, lng: number) => number | null;
}

export const SavedCarparksView: React.FC<SavedCarparksViewProps> = ({
  savedCarparkIds,
  allCarparks,
  vehicleType,
  selectedCarpark,
  onSelectCarpark,
  onOpenDetails,
  onToggleSave,
  onBrowseAll,
  calculateDistance,
}) => {
  const savedCarparks = allCarparks.filter((c) => savedCarparkIds.includes(c.id));

  if (savedCarparks.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <Star className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Saved Carparks Yet</h3>
        <p className="text-sm text-neutral-400 mb-6">
          Star your frequent destinations (like your home HDB carpark, office building, or favourite mall) to quickly check live availability before driving.
        </p>
        <button
          onClick={onBrowseAll}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Compass className="w-4 h-4" />
          <span>Browse Singapore Carparks</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Saved Frequent Carparks</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time status for your starred Singapore parking locations.
          </p>
        </div>
        <div className="text-xs font-mono text-neutral-400">
          {savedCarparks.length} location{savedCarparks.length > 1 ? 's' : ''} saved
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedCarparks.map((cp) => (
          <CarparkCard
            key={cp.id}
            carpark={cp}
            vehicleType={vehicleType}
            isSelected={selectedCarpark?.id === cp.id}
            isSaved={true}
            onSelect={onSelectCarpark}
            onOpenDetails={onOpenDetails}
            onToggleSave={onToggleSave}
            userDistanceKm={calculateDistance(cp.coordinates[0], cp.coordinates[1])}
          />
        ))}
      </div>
    </div>
  );
};
