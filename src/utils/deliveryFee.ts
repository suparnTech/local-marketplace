// Helper function to calculate delivery fee based on distance
// ₹10/km for first 5km, ₹5/km after that

export function calculateDeliveryFee(distanceInKm: number): number {
    if (distanceInKm <= 0) return 0;

    const firstTierKm = Math.min(distanceInKm, 5);
    const secondTierKm = Math.max(0, distanceInKm - 5);

    const firstTierFee = firstTierKm * 10; // ₹10/km for first 5km
    const secondTierFee = secondTierKm * 5;  // ₹5/km after 5km

    return Math.round(firstTierFee + secondTierFee);
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// Example usage:
// const distance = calculateDistance(28.7041, 77.1025, 28.5355, 77.3910); // ~30km
// const fee = calculateDeliveryFee(distance); // ₹50 + ₹125 = ₹175
