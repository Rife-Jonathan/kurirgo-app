export const calculatePricing = (distance: number, itemType: string, itemWeight: number) => {
  let basePrice = 5000;
  if (itemType === "SMALL_PACKAGE") basePrice = 8000;
  if (itemType === "MEDIUM_PACKAGE") basePrice = 12000;
  if (itemType === "LARGE_PACKAGE") basePrice = 18000;

  let distancePrice = 0;
  if (distance <= 5) {
    distancePrice = distance * 3000;
  } else if (distance <= 15) {
    distancePrice = (5 * 3000) + ((distance - 5) * 2500);
  } else {
    distancePrice = (5 * 3000) + (10 * 2500) + ((distance - 15) * 2000);
  }

  let weightPrice = 0;
  if (itemWeight > 1) {
    weightPrice = Math.ceil(itemWeight - 1) * 1500;
  }

  const totalPrice = basePrice + distancePrice + weightPrice;
  return { basePrice, distancePrice, weightPrice, totalPrice };
};

// Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};
