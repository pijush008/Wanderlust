/**
 * ================= GEO SERVICE (Interactive Maps) =================
 * 
 * Concepts:
 *   - Geo Queries: MongoDB $geoNear for finding nearby listings
 *   - Distance Calculations: Haversine formula for point-to-point distance
 *   - Map Clustering: Group nearby markers to avoid clutter
 *   - Nearby POI: Restaurants, hospitals, stations, attractions
 * 
 * Architecture:
 *   Listing Coordinates
 *         │
 *         ├── Nearby Listings (MongoDB $geoNear)
 *         ├── Nearby POI (pre-computed database)
 *         ├── Distance Calculator (Haversine)
 *         └── Map Cluster Generator
 */

const Listing = require("../models/listing");

// ================= HAVERSINE DISTANCE FORMULA =================
/**
 * Calculate distance between two coordinates (in km)
 * This is the core geo algorithm — calculates great-circle distance
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// ================= NEARBY POINTS OF INTEREST DATABASE =================
// Pre-computed POI data for major Indian tourist locations
const POI_DATABASE = {
  manali: {
    restaurants: [
      { name: "Drifters' Café", type: "cafe", lat: 32.2396, lng: 77.1887, rating: 4.5, cuisine: "Continental" },
      { name: "Johnson's Café", type: "restaurant", lat: 32.2420, lng: 77.1770, rating: 4.3, cuisine: "Indian" },
      { name: "Lazy Dog Lounge", type: "restaurant", lat: 32.2450, lng: 77.1890, rating: 4.2, cuisine: "Multi-cuisine" },
      { name: "Chopsticks", type: "restaurant", lat: 32.2410, lng: 77.1880, rating: 4.0, cuisine: "Chinese" },
    ],
    hospitals: [
      { name: "Lady Willingdon Hospital", type: "hospital", lat: 32.2432, lng: 77.1880, phone: "01902-252379" },
      { name: "Mission Hospital", type: "hospital", lat: 32.2400, lng: 77.1750, phone: "01902-253085" },
    ],
    railway_stations: [
      { name: "Joginder Nagar (nearest)", type: "railway", lat: 31.9870, lng: 76.7350, distance_km: 55 },
      { name: "Chandigarh Railway Station", type: "railway", lat: 30.6920, lng: 76.7870, distance_km: 310 },
    ],
    tourist_attractions: [
      { name: "Hadimba Temple", type: "temple", lat: 32.2434, lng: 77.1680, rating: 4.6, duration: "1h" },
      { name: "Solang Valley", type: "adventure", lat: 32.3150, lng: 77.1570, rating: 4.7, duration: "4h" },
      { name: "Rohtang Pass", type: "viewpoint", lat: 32.3722, lng: 77.2478, rating: 4.8, duration: "6h" },
      { name: "Mall Road", type: "market", lat: 32.2396, lng: 77.1887, rating: 4.2, duration: "2h" },
      { name: "Vashisht Hot Springs", type: "nature", lat: 32.2560, lng: 77.1780, rating: 4.3, duration: "1h" },
    ],
  },
  goa: {
    restaurants: [
      { name: "Gunpowder", type: "restaurant", lat: 15.5020, lng: 73.9120, rating: 4.6, cuisine: "South Indian" },
      { name: "Thalassa", type: "restaurant", lat: 15.6050, lng: 73.7440, rating: 4.5, cuisine: "Greek" },
      { name: "Fisherman's Wharf", type: "restaurant", lat: 15.4000, lng: 73.8780, rating: 4.3, cuisine: "Seafood" },
      { name: "Britto's", type: "restaurant", lat: 15.5510, lng: 73.7550, rating: 4.1, cuisine: "Multi-cuisine" },
    ],
    hospitals: [
      { name: "Goa Medical College", type: "hospital", lat: 15.3980, lng: 73.8720, phone: "0832-2458727" },
      { name: "Manipal Hospital Goa", type: "hospital", lat: 15.4100, lng: 73.8800, phone: "0832-2882555" },
    ],
    railway_stations: [
      { name: "Madgaon Junction", type: "railway", lat: 15.2832, lng: 73.9862, distance_km: 0 },
      { name: "Thivim Railway Station", type: "railway", lat: 15.6030, lng: 73.8150, distance_km: 0 },
      { name: "Vasco da Gama Station", type: "railway", lat: 15.3950, lng: 73.8120, distance_km: 0 },
    ],
    tourist_attractions: [
      { name: "Baga Beach", type: "beach", lat: 15.5551, lng: 73.7514, rating: 4.5, duration: "3h" },
      { name: "Fort Aguada", type: "heritage", lat: 15.4920, lng: 73.7730, rating: 4.4, duration: "2h" },
      { name: "Dudhsagar Falls", type: "waterfall", lat: 15.3144, lng: 74.3143, rating: 4.7, duration: "6h" },
      { name: "Basilica of Bom Jesus", type: "heritage", lat: 15.5009, lng: 73.9116, rating: 4.6, duration: "1h" },
      { name: "Anjuna Flea Market", type: "market", lat: 15.5740, lng: 73.7410, rating: 4.2, duration: "3h" },
    ],
  },
  jaipur: {
    restaurants: [
      { name: "1135 AD", type: "restaurant", lat: 26.9855, lng: 75.8513, rating: 4.7, cuisine: "Rajasthani" },
      { name: "Tapri Central", type: "cafe", lat: 26.9100, lng: 75.7870, rating: 4.4, cuisine: "Cafe" },
      { name: "Suvarna Mahal", type: "restaurant", lat: 26.9260, lng: 75.8230, rating: 4.5, cuisine: "Indian" },
    ],
    hospitals: [
      { name: "SMS Hospital", type: "hospital", lat: 26.9050, lng: 75.8060, phone: "0141-2518281" },
      { name: "Fortis Escorts Hospital", type: "hospital", lat: 26.8500, lng: 75.7650, phone: "0141-2547000" },
    ],
    railway_stations: [
      { name: "Jaipur Junction", type: "railway", lat: 26.9196, lng: 75.7878, distance_km: 0 },
    ],
    tourist_attractions: [
      { name: "Amber Fort", type: "heritage", lat: 26.9855, lng: 75.8513, rating: 4.8, duration: "3h" },
      { name: "Hawa Mahal", type: "heritage", lat: 26.9239, lng: 75.8267, rating: 4.6, duration: "1h" },
      { name: "City Palace", type: "heritage", lat: 26.9258, lng: 75.8237, rating: 4.7, duration: "2h" },
      { name: "Nahargarh Fort", type: "heritage", lat: 26.9372, lng: 75.8154, rating: 4.5, duration: "2h" },
      { name: "Jantar Mantar", type: "heritage", lat: 26.9247, lng: 75.8244, rating: 4.4, duration: "1h" },
    ],
  },
  udaipur: {
    restaurants: [
      { name: "Ambrai Restaurant", type: "restaurant", lat: 24.5760, lng: 73.6800, rating: 4.6, cuisine: "Indian" },
      { name: "Upré by 1559 AD", type: "restaurant", lat: 24.5770, lng: 73.6830, rating: 4.5, cuisine: "Multi-cuisine" },
    ],
    hospitals: [
      { name: "GBH American Hospital", type: "hospital", lat: 24.5850, lng: 73.7100, phone: "0294-2430303" },
    ],
    railway_stations: [
      { name: "Udaipur City Station", type: "railway", lat: 24.5800, lng: 73.6850, distance_km: 0 },
    ],
    tourist_attractions: [
      { name: "Lake Pichola", type: "nature", lat: 24.5720, lng: 73.6780, rating: 4.8, duration: "2h" },
      { name: "City Palace", type: "heritage", lat: 24.5764, lng: 73.6913, rating: 4.7, duration: "3h" },
      { name: "Sajjangarh Palace", type: "viewpoint", lat: 24.5800, lng: 73.6500, rating: 4.5, duration: "2h" },
    ],
  },
  rishikesh: {
    restaurants: [
      { name: "Little Buddha Café", type: "cafe", lat: 30.1210, lng: 78.3200, rating: 4.3, cuisine: "Continental" },
      { name: "Chotiwala", type: "restaurant", lat: 30.1090, lng: 78.2680, rating: 4.1, cuisine: "Indian" },
    ],
    hospitals: [
      { name: "AIIMS Rishikesh", type: "hospital", lat: 30.0670, lng: 78.2700, phone: "0135-2462930" },
    ],
    railway_stations: [
      { name: "Rishikesh Railway Station", type: "railway", lat: 30.1050, lng: 78.2670, distance_km: 0 },
      { name: "Haridwar Junction", type: "railway", lat: 29.9457, lng: 78.1642, distance_km: 25 },
    ],
    tourist_attractions: [
      { name: "Laxman Jhula", type: "heritage", lat: 30.1210, lng: 78.3200, rating: 4.5, duration: "1h" },
      { name: "Ram Jhula", type: "heritage", lat: 30.1090, lng: 78.2950, rating: 4.4, duration: "1h" },
      { name: "Triveni Ghat", type: "spiritual", lat: 30.1040, lng: 78.2670, rating: 4.6, duration: "1h" },
      { name: "Beatles Ashram", type: "heritage", lat: 30.1150, lng: 78.3100, rating: 4.3, duration: "2h" },
    ],
  },
  darjeeling: {
    restaurants: [
      { name: "Glenary's", type: "restaurant", lat: 27.0440, lng: 88.2630, rating: 4.4, cuisine: "Multi-cuisine" },
      { name: "Keventer's", type: "cafe", lat: 27.0450, lng: 88.2640, rating: 4.3, cuisine: "Breakfast" },
    ],
    hospitals: [
      { name: "Planters' Hospital", type: "hospital", lat: 27.0400, lng: 88.2600, phone: "0354-2254217" },
    ],
    railway_stations: [
      { name: "Darjeeling Station (Toy Train)", type: "railway", lat: 27.0430, lng: 88.2620, distance_km: 0 },
      { name: "New Jalpaiguri (nearest major)", type: "railway", lat: 26.6830, lng: 88.4300, distance_km: 75 },
    ],
    tourist_attractions: [
      { name: "Tiger Hill", type: "viewpoint", lat: 26.9970, lng: 88.2750, rating: 4.8, duration: "3h" },
      { name: "Batasia Loop", type: "viewpoint", lat: 27.0280, lng: 88.2530, rating: 4.5, duration: "1h" },
      { name: "Peace Pagoda", type: "spiritual", lat: 27.0350, lng: 88.2500, rating: 4.4, duration: "1h" },
      { name: "Happy Valley Tea Estate", type: "nature", lat: 27.0500, lng: 88.2700, rating: 4.6, duration: "2h" },
    ],
  },
};

// ================= NEARBY LISTINGS (MongoDB Geo Query) =================

/**
 * Find listings near a given coordinate using MongoDB $geoNear
 * Uses 2dsphere index on geometry field
 */
async function findNearbyListings(longitude, latitude, maxDistanceKm = 50, limit = 10, excludeId = null) {
  const query = {
    geometry: {
      $near: {
        $geometry: { type: "Point", coordinates: [longitude, latitude] },
        $maxDistance: maxDistanceKm * 1000, // Convert to meters
      },
    },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const listings = await Listing.find(query)
    .select("title location price image geometry")
    .limit(limit)
    .lean();

  // Add distance to each result
  return listings.map((l) => {
    const [lng, lat] = l.geometry.coordinates;
    const distance = haversineDistance(latitude, longitude, lat, lng);
    return {
      ...l,
      distance: Math.round(distance * 10) / 10, // 1 decimal
      distanceLabel: distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`,
    };
  });
}

// ================= GET NEARBY POI =================

/**
 * Get nearby points of interest for a location
 * Returns restaurants, hospitals, stations, attractions
 */
function getNearbyPOI(location, coordinates = null) {
  const locKey = location.toLowerCase().trim();
  const poi = POI_DATABASE[locKey];

  if (poi) {
    // Add distance from listing if coordinates provided
    if (coordinates) {
      const [lng, lat] = coordinates;
      const addDistance = (items) =>
        items.map((item) => ({
          ...item,
          distance: item.lat && item.lng
            ? Math.round(haversineDistance(lat, lng, item.lat, item.lng) * 10) / 10
            : item.distance_km || null,
        })).sort((a, b) => (a.distance || 999) - (b.distance || 999));

      return {
        restaurants: addDistance(poi.restaurants || []),
        hospitals: addDistance(poi.hospitals || []),
        railway_stations: addDistance(poi.railway_stations || []),
        tourist_attractions: addDistance(poi.tourist_attractions || []),
      };
    }
    return poi;
  }

  // Generic fallback
  return {
    restaurants: [],
    hospitals: [],
    railway_stations: [],
    tourist_attractions: [],
    message: `POI data not available for ${location}. Showing map only.`,
  };
}

// ================= MAP CLUSTERING =================

/**
 * Group nearby listings into clusters for map display
 * Prevents marker overlap on zoomed-out views
 * 
 * Algorithm: Grid-based clustering
 *   - Divide map into grid cells
 *   - Group listings in same cell
 *   - Return cluster center + count
 */
function clusterListings(listings, zoomLevel = 10) {
  // Grid size decreases as zoom increases (more detail at higher zoom)
  const gridSize = 1 / Math.pow(2, zoomLevel - 8); // degrees

  const clusters = {};

  for (const listing of listings) {
    if (!listing.geometry?.coordinates) continue;
    const [lng, lat] = listing.geometry.coordinates;

    // Grid cell key
    const cellX = Math.floor(lng / gridSize);
    const cellY = Math.floor(lat / gridSize);
    const key = `${cellX}:${cellY}`;

    if (!clusters[key]) {
      clusters[key] = {
        center: { lng: 0, lat: 0 },
        listings: [],
        count: 0,
        totalLng: 0,
        totalLat: 0,
      };
    }

    clusters[key].listings.push({
      _id: listing._id,
      title: listing.title,
      price: listing.price,
      location: listing.location,
    });
    clusters[key].totalLng += lng;
    clusters[key].totalLat += lat;
    clusters[key].count++;
  }

  // Calculate cluster centers
  return Object.values(clusters).map((cluster) => ({
    center: {
      lng: cluster.totalLng / cluster.count,
      lat: cluster.totalLat / cluster.count,
    },
    count: cluster.count,
    listings: cluster.listings,
    isCluster: cluster.count > 1,
  }));
}

// ================= EXPORTS =================
module.exports = {
  haversineDistance,
  findNearbyListings,
  getNearbyPOI,
  clusterListings,
  POI_DATABASE,
};
