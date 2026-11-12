export type Region = 'Central / CBD' | 'East' | 'West' | 'North' | 'North-East';

export type Agency = 'HDB' | 'URA' | 'Commercial / Mall' | 'LTA';

export type CarparkType = 'Multi-Storey (MSCP)' | 'Surface' | 'Basement' | 'Mechanised';

export type VehicleType = 'car' | 'motorcycle' | 'heavy';

export interface LotDetail {
  total: number;
  available: number;
}

export interface RatesInfo {
  weekdayDay: string; // e.g., "$0.60 per 30 mins (07:00 - 17:00)"
  weekdayNight: string; // e.g., "$0.60 per 30 mins, max $5.00 (17:00 - 07:00)"
  saturday: string;
  sundayPH: string;
  gracePeriodMinutes: number; // e.g. 15 mins
  isFreeSunday: boolean;
  centralAreaPricing: boolean;
}

export interface EVChargerInfo {
  available: boolean;
  provider?: string; // e.g. "SP Group (50kW DC / 22kW AC)", "Shell Recharge", "CDG ENGIE"
  portsCount?: number;
}

export interface Carpark {
  id: string;
  carparkNumber: string; // Official code e.g. "ACB", "HE12", "TM39", "ION01"
  name: string;
  address: string;
  postalCode: string;
  region: Region;
  agency: Agency;
  carparkType: CarparkType;
  coordinates: [number, number]; // [lat, lng]
  heightLimitMeters: number | null; // e.g. 2.1 or null if surface
  rates: RatesInfo;
  evCharging: EVChargerInfo;
  hasGantry: boolean;
  paymentMethods: string[]; // e.g. ["EPS (CashCard / NETS / EZ-Link / Motoring Card)", "Parking.sg (Coupon)"]
  lots: {
    car: LotDetail;
    motorcycle?: LotDetail;
    heavy?: LotDetail;
  };
  lastUpdated: string; // ISO string
  occupancyTrend: number[]; // 24 values for 00:00 to 23:00 percentage (0-100)
}

export type AvailabilityStatus = 'ample' | 'moderate' | 'limited' | 'full';

export interface FilterOptions {
  searchQuery: string;
  region: 'All' | Region;
  agency: 'All' | Agency;
  vehicleType: VehicleType;
  onlyAvailable: boolean;
  onlyEV: boolean;
  onlyFreeSunday: boolean;
  onlySheltered: boolean;
  sortBy: 'availability' | 'rate' | 'name' | 'distance';
}
