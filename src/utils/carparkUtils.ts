import { Carpark, VehicleType, AvailabilityStatus } from '../types/carpark';

/**
 * Calculates Haversine distance between two coordinates in km
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Returns availability status enum based on available lots and capacity
 */
export function getAvailabilityStatus(
  available: number,
  total: number
): AvailabilityStatus {
  if (available <= 0) return 'full';
  const pct = (available / total) * 100;
  if (pct < 10 || available < 10) return 'limited';
  if (pct < 30 || available < 30) return 'moderate';
  return 'ample';
}

/**
 * Get lot numbers based on chosen vehicle type
 */
export function getLotDetailForVehicle(carpark: Carpark, vehicleType: VehicleType) {
  if (vehicleType === 'motorcycle' && carpark.lots.motorcycle) {
    return carpark.lots.motorcycle;
  }
  if (vehicleType === 'heavy' && carpark.lots.heavy) {
    return carpark.lots.heavy;
  }
  return carpark.lots.car;
}

/**
 * Estimates parking fee in SGD for a given session
 */
export function calculateEstimatedFee(
  carpark: Carpark,
  dayType: 'weekday' | 'saturday' | 'sunday',
  startHour: number, // 0 - 23
  startMinute: number, // 0 - 59
  durationMinutes: number
): {
  totalFee: number;
  breakdown: string[];
  isGracePeriod: boolean;
} {
  const grace = carpark.rates.gracePeriodMinutes || 10;
  if (durationMinutes <= grace) {
    return {
      totalFee: 0,
      breakdown: [`Stayed ${durationMinutes} mins (within ${grace} min grace period: $0.00)`],
      isGracePeriod: true,
    };
  }

  // Check Sunday Free Parking for HDB
  if (dayType === 'sunday' && carpark.rates.isFreeSunday) {
    const endMinutesFromMidnight = startHour * 60 + startMinute + durationMinutes;
    const startMinutesFromMidnight = startHour * 60 + startMinute;
    // Sunday free parking is 07:30 to 22:30 (450 mins to 1350 mins)
    if (startMinutesFromMidnight >= 450 && endMinutesFromMidnight <= 1350) {
      return {
        totalFee: 0,
        breakdown: ['Sunday Free Parking Scheme (07:30 - 22:30): $0.00'],
        isGracePeriod: false,
      };
    }
  }

  // Simplified realistic Singapore fee calculation
  const hours = durationMinutes / 60;
  const halfHours = Math.ceil(durationMinutes / 30);
  const breakdown: string[] = [];

  if (carpark.agency === 'HDB' || carpark.agency === 'URA') {
    const ratePerHalf = carpark.rates.centralAreaPricing ? 1.20 : 0.60;
    // Night parking cap check
    const isNightTime = startHour >= 22 || startHour < 7;
    if (isNightTime && hours >= 4) {
      const fee = Math.min(halfHours * ratePerHalf, 5.00);
      breakdown.push(`Night parking rate applied (capped at $5.00)`);
      return { totalFee: fee, breakdown, isGracePeriod: false };
    }
    const fee = halfHours * ratePerHalf;
    breakdown.push(`${halfHours} x 30-min blocks @ $${ratePerHalf.toFixed(2)}: $${fee.toFixed(2)}`);
    return { totalFee: Math.round(fee * 100) / 100, breakdown, isGracePeriod: false };
  }

  // Commercial / Malls
  if (carpark.id === 'imm-building' && dayType === 'weekday' && hours <= 1) {
    breakdown.push('IMM 1st Hour Free Weekday Promo: $0.00');
    return { totalFee: 0, breakdown, isGracePeriod: false };
  }

  if (startHour >= 18) {
    // Per entry evening rate
    if (carpark.id === 'ion-orchard') {
      breakdown.push('Evening per entry (after 17:00): $4.50');
      return { totalFee: 4.50, breakdown, isGracePeriod: false };
    }
    if (carpark.id === 'suntec-city') {
      breakdown.push('Evening per entry (after 17:00): $3.50');
      return { totalFee: 3.50, breakdown, isGracePeriod: false };
    }
    breakdown.push('Evening per entry flat rate: $3.00');
    return { totalFee: 3.00, breakdown, isGracePeriod: false };
  }

  // Daytime mall formula: 1st hr + subsequent 30 min blocks
  let firstHourRate = 2.40;
  let subsequentRatePerHalf = 1.20;

  if (carpark.id === 'marina-bay-sands') {
    firstHourRate = 14.00;
    subsequentRatePerHalf = 1.50;
  } else if (carpark.id === 'ion-orchard') {
    firstHourRate = 3.20;
    subsequentRatePerHalf = 1.60;
  } else if (carpark.id === 'suntec-city') {
    firstHourRate = 2.60;
    subsequentRatePerHalf = 1.30;
  } else if (carpark.id === 'jewel-changi-airport') {
    firstHourRate = 2.40;
    subsequentRatePerHalf = 2.50;
  }

  if (hours <= 1) {
    breakdown.push(`1st hour: $${firstHourRate.toFixed(2)}`);
    return { totalFee: firstHourRate, breakdown, isGracePeriod: false };
  }

  const extraHalfHours = Math.ceil((durationMinutes - 60) / 30);
  const extraFee = extraHalfHours * subsequentRatePerHalf;
  const total = firstHourRate + extraFee;
  breakdown.push(`1st hour: $${firstHourRate.toFixed(2)}`);
  breakdown.push(`${extraHalfHours} subsequent 30-min blocks: $${extraFee.toFixed(2)}`);

  return { totalFee: Math.round(total * 100) / 100, breakdown, isGracePeriod: false };
}
