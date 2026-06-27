


// for india 
const sampleListings = [
  {
    title: "Himalayan Wooden Cabin",
    description: "A cozy wooden cabin surrounded by snow-capped Himalayan peaks, perfect for peace and adventure.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/himalayan-cabin/800/600" },
    price: 1800,
    location: "Manali",
    country: "India",
    geometry: { type: "Point", coordinates: [77.168, 32.2432] }
  },
  {
    title: "Lakeside Cottage in Udaipur",
    description: "Enjoy royal vibes with serene lake views near historic palaces and ghats.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/udaipur-lake/800/600" },
    price: 2200,
    location: "Udaipur",
    country: "India",
    geometry: { type: "Point", coordinates: [73.6777, 24.5854] }
  },
  {
    title: "Beach Hut in Goa",
    description: "A relaxed beach hut just steps away from golden sands and vibrant nightlife.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/goa-beach/800/600" },
    price: 2000,
    location: "Goa",
    country: "India",
    geometry: { type: "Point", coordinates: [74.124, 15.2993] }
  },
  {
    title: "Tea Garden Stay",
    description: "Wake up to misty mornings surrounded by lush tea plantations.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/darjeeling-tea/800/600" },
    price: 1700,
    location: "Darjeeling",
    country: "India",
    geometry: { type: "Point", coordinates: [88.2627, 27.0360] }
  },
  {
    title: "Backwater Villa",
    description: "A peaceful villa overlooking calm backwaters with traditional Kerala charm.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/kerala-backwater/800/600" },
    price: 2500,
    location: "Alleppey",
    country: "India",
    geometry: { type: "Point", coordinates: [76.4783, 9.4981] }
  },
  {
    title: "Desert Camp Experience",
    description: "Luxury tents under starry skies in the golden Thar desert.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/thar-desert/800/600" },
    price: 3000,
    location: "Jaisalmer",
    country: "India",
    geometry: { type: "Point", coordinates: [70.9167, 26.9124] }
  },
  {
    title: "Colonial Heritage Stay",
    description: "A charming British-era bungalow in the Nilgiri hills.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/ooty-bungalow/800/600" },
    price: 1900,
    location: "Ooty",
    country: "India",
    geometry: { type: "Point", coordinates: [76.7040, 11.4064] }
  },
  {
    title: "Luxury Houseboat",
    description: "Traditional houseboat stay with modern comforts and scenic views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/houseboat/800/600" },
    price: 3500,
    location: "Kumarakom",
    country: "India",
    geometry: { type: "Point", coordinates: [76.3363, 9.5836] }
  },
  {
    title: "Mountain View Homestay",
    description: "Simple and peaceful homestay with stunning mountain views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/mussoorie-view/800/600" },
    price: 1400,
    location: "Mussoorie",
    country: "India",
    geometry: { type: "Point", coordinates: [78.0747, 30.4590] }
  },
  {
    title: "Spiritual Retreat Stay",
    description: "Calm and meditative stay near the holy Ganges river.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/rishikesh-retreat/800/600" },
    price: 1200,
    location: "Rishikesh",
    country: "India",
    geometry: { type: "Point", coordinates: [78.2676, 30.0869] }
  },
  {
    title: "Hilltop Cottage",
    description: "Quiet hilltop cottage with panoramic valley views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/shillong-hill/800/600" },
    price: 1600,
    location: "Shillong",
    country: "India",
    geometry: { type: "Point", coordinates: [91.8793, 25.5740] }
  },
  {
    title: "Forest Lodge",
    description: "Stay amidst wildlife and dense forests.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/forest-lodge/800/600" },
    price: 2100,
    location: "Jim Corbett",
    country: "India",
    geometry: { type: "Point", coordinates: [78.7766, 29.5303] }
  },
  {
    title: "Snow Valley Cabin",
    description: "Snow-covered valleys and wooden interiors.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/gulmarg-snow/800/600" },
    price: 2000,
    location: "Gulmarg",
    country: "India",
    geometry: { type: "Point", coordinates: [74.3763, 34.0495] }
  },
  {
    title: "Riverfront Cottage",
    description: "Beautiful riverside stay with mountain air.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/kasol-river/800/600" },
    price: 1500,
    location: "Kasol",
    country: "India",
    geometry: { type: "Point", coordinates: [76.9750, 32.0036] }
  },
  {
    title: "Royal Haveli",
    description: "Live like royalty in a traditional Rajasthani haveli.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/jaipur-haveli/800/600" },
    price: 2800,
    location: "Jaipur",
    country: "India",
    geometry: { type: "Point", coordinates: [75.7873, 26.9124] }
  },
  {
    title: "Beach Resort Stay",
    description: "Calm beachside stay with sunrise views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/pondy-beach/800/600" },
    price: 2400,
    location: "Pondicherry",
    country: "India",
    geometry: { type: "Point", coordinates: [79.8083, 11.9416] }
  },
  {
    title: "City Luxury Apartment",
    description: "Modern apartment in the heart of the city.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/mumbai-apartment/800/600" },
    price: 2600,
    location: "Mumbai",
    country: "India",
    geometry: { type: "Point", coordinates: [72.8777, 19.0760] }
  },
  {
    title: "Heritage Palace Stay",
    description: "Experience royal luxury inside a real palace.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/jodhpur-palace/800/600" },
    price: 5000,
    location: "Jodhpur",
    country: "India",
    geometry: { type: "Point", coordinates: [73.0243, 26.2389] }
  },
  {
    title: "Island Beach Hut",
    description: "White sand beaches and crystal clear water.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/andaman-island/800/600" },
    price: 3200,
    location: "Andaman & Nicobar",
    country: "India",
    geometry: { type: "Point", coordinates: [92.7500, 11.6670] }
  },
  {
    title: "Hill View Homestay",
    description: "Peaceful village life with scenic views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/coorg-hills/800/600" },
    price: 1300,
    location: "Coorg",
    country: "India",
    geometry: { type: "Point", coordinates: [75.8069, 12.3375] }
  },

  // Add remaining 30 listings with similar structure and proper geometry
  {
    title: "Arctic Glacier Cabin",
    description: "Chill in comfort with glacier views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/arctic-cabin/800/600" },
    price: 4000,
    location: "Leh",
    country: "India",
    geometry: { type: "Point", coordinates: [77.5775, 34.1526] }
  },
  {
    title: "Jungle Retreat",
    description: "Immersive stay in the jungles of Madhya Pradesh.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/jungle-retreat/800/600" },
    price: 2300,
    location: "Kanha",
    country: "India",
    geometry: { type: "Point", coordinates: [80.3500, 22.3340] }
  },
  {
    title: "Mountain Lodge",
    description: "Stay amidst high peaks and fresh air.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/mountain-lodge/800/600" },
    price: 2700,
    location: "Kullu",
    country: "India",
    geometry: { type: "Point", coordinates: [77.1900, 31.9610] }
  },
  {
    title: "Desert Villa",
    description: "Traditional Rajasthani experience under the desert sky.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/desert-villa/800/600" },
    price: 3100,
    location: "Bikaner",
    country: "India",
    geometry: { type: "Point", coordinates: [73.3000, 28.0229] }
  },
  {
    title: "River Side Camp",
    description: "Relax near flowing river in natural surroundings.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/river-camp/800/600" },
    price: 1900,
    location: "Ranakpur",
    country: "India",
    geometry: { type: "Point", coordinates: [73.4040, 25.8885] }
  },
  {
    title: "Tea Valley Stay",
    description: "Misty mornings among tea plantations.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/tea-valley/800/600" },
    price: 1800,
    location: "Munnar",
    country: "India",
    geometry: { type: "Point", coordinates: [77.0592, 10.0889] }
  },
  {
    title: "Lake View Cabin",
    description: "Cabin overlooking serene lakes.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/lake-cabin/800/600" },
    price: 1600,
    location: "Nainital",
    country: "India",
    geometry: { type: "Point", coordinates: [79.4542, 29.3919] }
  },
  {
    title: "Hilltop Inn",
    description: "Stay with panoramic hill views.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/hilltop-inn/800/600" },
    price: 1500,
    location: "Coorg",
    country: "India",
    geometry: { type: "Point", coordinates: [75.7060, 12.3368] }
  },
  {
    title: "Luxury Beach Villa",
    description: "Premium villa on the coast with private beach.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/luxury-beach-villa/800/600" },
    price: 5000,
    location: "Goa",
    country: "India",
    geometry: { type: "Point", coordinates: [73.7790, 15.5050] }
  },
  {
    title: "Forest Hideaway",
    description: "Secluded forest cabin for a quiet retreat.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/forest-hideaway/800/600" },
    price: 2200,
    location: "Sundarbans",
    country: "India",
    geometry: { type: "Point", coordinates: [88.9000, 21.9497] }
  },
  {
    title: "Snow Peak Lodge",
    description: "Lodge surrounded by snow peaks.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/snow-peak-lodge/800/600" },
    price: 3000,
    location: "Auli",
    country: "India",
    geometry: { type: "Point", coordinates: [79.6911, 30.7290] }
  },
  {
    title: "Desert Safari Camp",
    description: "Experience desert under the stars.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/desert-safari/800/600" },
    price: 3200,
    location: "Jaisalmer",
    country: "India",
    geometry: { type: "Point", coordinates: [70.9167, 26.9124] }
  },
  {
    title: "Backwater Houseboat",
    description: "Stay on a traditional Kerala houseboat.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/backwater-houseboat/800/600" },
    price: 3600,
    location: "Alleppey",
    country: "India",
    geometry: { type: "Point", coordinates: [76.4783, 9.4981] }
  },
  {
    title: "Mountain Retreat",
    description: "Peaceful cabin in the mountains.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/mountain-retreat/800/600" },
    price: 2800,
    location: "Leh",
    country: "India",
    geometry: { type: "Point", coordinates: [77.5775, 34.1526] }
  },
  {
    title: "Lakefront Villa",
    description: "Villa on a serene lake.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/lakefront-villa/800/600" },
    price: 3300,
    location: "Udaipur",
    country: "India",
    geometry: { type: "Point", coordinates: [73.6777, 24.5854] }
  },
  {
    title: "Coastal Cottage",
    description: "Cottage near the coast with fresh sea breeze.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/coastal-cottage/800/600" },
    price: 2500,
    location: "Pondicherry",
    country: "India",
    geometry: { type: "Point", coordinates: [79.8083, 11.9416] }
  },
  {
    title: "Forest Cabin Retreat",
    description: "Secluded cabin in the forest.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/forest-cabin-retreat/800/600" },
    price: 2100,
    location: "Jim Corbett",
    country: "India",
    geometry: { type: "Point", coordinates: [78.7766, 29.5303] }
  },
  {
    title: "Snowy Hillside Lodge",
    description: "Stay with stunning snow-covered hills.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/snowy-hillside-lodge/800/600" },
    price: 3000,
    location: "Gulmarg",
    country: "India",
    geometry: { type: "Point", coordinates: [74.3763, 34.0495] }
  },
  {
    title: "Tea Plantation Villa",
    description: "Stay amidst tea plantations.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/tea-plantation-villa/800/600" },
    price: 1900,
    location: "Darjeeling",
    country: "India",
    geometry: { type: "Point", coordinates: [88.2627, 27.0360] }
  },
  {
    title: "River View Cabin",
    description: "Cabin with a view of the river.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/river-view-cabin/800/600" },
    price: 1500,
    location: "Kasol",
    country: "India",
    geometry: { type: "Point", coordinates: [76.9750, 32.0036] }
  },
  {
    title: "Hilltop Heritage House",
    description: "Heritage stay on a hilltop.",
    image: { filename: "listingimage", url: "https://picsum.photos/seed/hilltop-heritage-house/800/600" },
    price: 2800,
    location: "Ooty",
    country: "India",
    geometry: { type: "Point", coordinates: [76.7040, 11.4064] }
  }
];

module.exports = { data: sampleListings };













//  const sampleListings = [
//   {
//     title: "Cozy Beachfront Cottage",
//     description:
//       "Escape to this charming beachfront cottage for a relaxing getaway. Enjoy stunning ocean views and easy access to the beach.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1500,
//     location: "Malibu",
//     country: "United States",
//   },
//   {
//     title: "Modern Loft in Downtown",
//     description:
//       "Stay in the heart of the city in this stylish loft apartment. Perfect for urban explorers!",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHRyYXZlbHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1200,
//     location: "New York City",
//     country: "United States",
//   },
//   {
//     title: "Mountain Retreat",
//     description:
//       "Unplug and unwind in this peaceful mountain cabin. Surrounded by nature, it's a perfect place to recharge.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1000,
//     location: "Aspen",
//     country: "United States",
//   },
//   {
//     title: "Historic Villa in Tuscany",
//     description:
//       "Experience the charm of Tuscany in this beautifully restored villa. Explore the rolling hills and vineyards.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8aG90ZWxzfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2500,
//     location: "Florence",
//     country: "Italy",
//   },
//   {
//     title: "Secluded Treehouse Getaway",
//     description:
//       "Live among the treetops in this unique treehouse retreat. A true nature lover's paradise.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 800,
//     location: "Portland",
//     country: "United States",
//   },
//   {
//     title: "Beachfront Paradise",
//     description:
//       "Step out of your door onto the sandy beach. This beachfront condo offers the ultimate relaxation.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGhvdGVsc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2000,
//     location: "Cancun",
//     country: "Mexico",
//   },
//   {
//     title: "Rustic Cabin by the Lake",
//     description:
//       "Spend your days fishing and kayaking on the serene lake. This cozy cabin is perfect for outdoor enthusiasts.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 900,
//     location: "Lake Tahoe",
//     country: "United States",
//   },
//   {
//     title: "Luxury Penthouse with City Views",
//     description:
//       "Indulge in luxury living with panoramic city views from this stunning penthouse apartment.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1622396481328-9b1b78cdd9fd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 3500,
//     location: "Los Angeles",
//     country: "United States",
//   },
//   {
//     title: "Ski-In/Ski-Out Chalet",
//     description:
//       "Hit the slopes right from your doorstep in this ski-in/ski-out chalet in the Swiss Alps.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 3000,
//     location: "Verbier",
//     country: "Switzerland",
//   },
//   {
//     title: "Safari Lodge in the Serengeti",
//     description:
//       "Experience the thrill of the wild in a comfortable safari lodge. Witness the Great Migration up close.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjl8fG1vdW50YWlufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 4000,
//     location: "Serengeti National Park",
//     country: "Tanzania",
//   },
//   {
//     title: "Historic Canal House",
//     description:
//       "Stay in a piece of history in this beautifully preserved canal house in Amsterdam's iconic district.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y2FtcGluZ3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1800,
//     location: "Amsterdam",
//     country: "Netherlands",
//   },
//   {
//     title: "Private Island Retreat",
//     description:
//       "Have an entire island to yourself for a truly exclusive and unforgettable vacation experience.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1618140052121-39fc6db33972?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bG9kZ2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 10000,
//     location: "Fiji",
//     country: "Fiji",
//   },
//   {
//     title: "Charming Cottage in the Cotswolds",
//     description:
//       "Escape to the picturesque Cotswolds in this quaint and charming cottage with a thatched roof.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1602088113235-229c19758e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YmVhY2glMjB2YWNhdGlvbnxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1200,
//     location: "Cotswolds",
//     country: "United Kingdom",
//   },
//   {
//     title: "Historic Brownstone in Boston",
//     description:
//       "Step back in time in this elegant historic brownstone located in the heart of Boston.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1533619239233-6280475a633a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHNreSUyMHZhY2F0aW9ufGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2200,
//     location: "Boston",
//     country: "United States",
//   },
//   {
//     title: "Beachfront Bungalow in Bali",
//     description:
//       "Relax on the sandy shores of Bali in this beautiful beachfront bungalow with a private pool.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1602391833977-358a52198938?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1800,
//     location: "Bali",
//     country: "Indonesia",
//   },
//   {
//     title: "Mountain View Cabin in Banff",
//     description:
//       "Enjoy breathtaking mountain views from this cozy cabin in the Canadian Rockies.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1500,
//     location: "Banff",
//     country: "Canada",
//   },
//   {
//     title: "Art Deco Apartment in Miami",
//     description:
//       "Step into the glamour of the 1920s in this stylish Art Deco apartment in South Beach.",
//     image: {
//       filename: "listingimage",
//       url: "https://plus.unsplash.com/premium_photo-1670963964797-942df1804579?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1600,
//     location: "Miami",
//     country: "United States",
//   },
//   {
//     title: "Tropical Villa in Phuket",
//     description:
//       "Escape to a tropical paradise in this luxurious villa with a private infinity pool in Phuket.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1470165301023-58dab8118cc9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 3000,
//     location: "Phuket",
//     country: "Thailand",
//   },
//   {
//     title: "Historic Castle in Scotland",
//     description:
//       "Live like royalty in this historic castle in the Scottish Highlands. Explore the rugged beauty of the area.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1585543805890-6051f7829f98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGJlYWNoJTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 4000,
//     location: "Scottish Highlands",
//     country: "United Kingdom",
//   },
//   {
//     title: "Desert Oasis in Dubai",
//     description:
//       "Experience luxury in the middle of the desert in this opulent oasis in Dubai with a private pool.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZHViYWl8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 5000,
//     location: "Dubai",
//     country: "United Arab Emirates",
//   },
//   {
//     title: "Rustic Log Cabin in Montana",
//     description:
//       "Unplug and unwind in this cozy log cabin surrounded by the natural beauty of Montana.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1586375300773-8384e3e4916f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1100,
//     location: "Montana",
//     country: "United States",
//   },
//   {
//     title: "Beachfront Villa in Greece",
//     description:
//       "Enjoy the crystal-clear waters of the Mediterranean in this beautiful beachfront villa on a Greek island.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8dmlsbGF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2500,
//     location: "Mykonos",
//     country: "Greece",
//   },
//   {
//     title: "Eco-Friendly Treehouse Retreat",
//     description:
//       "Stay in an eco-friendly treehouse nestled in the forest. It's the perfect escape for nature lovers.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1488462237308-ecaa28b729d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8c2t5JTIwdmFjYXRpb258ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 750,
//     location: "Costa Rica",
//     country: "Costa Rica",
//   },
//   {
//     title: "Historic Cottage in Charleston",
//     description:
//       "Experience the charm of historic Charleston in this beautifully restored cottage with a private garden.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGxvZGdlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1600,
//     location: "Charleston",
//     country: "United States",
//   },
//   {
//     title: "Modern Apartment in Tokyo",
//     description:
//       "Explore the vibrant city of Tokyo from this modern and centrally located apartment.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1480796927426-f609979314bd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHRva3lvfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2000,
//     location: "Tokyo",
//     country: "Japan",
//   },
//   {
//     title: "Lakefront Cabin in New Hampshire",
//     description:
//       "Spend your days by the lake in this cozy cabin in the scenic White Mountains of New Hampshire.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1578645510447-e20b4311e3ce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDF8fGNhbXBpbmd8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1200,
//     location: "New Hampshire",
//     country: "United States",
//   },
//   {
//     title: "Luxury Villa in the Maldives",
//     description:
//       "Indulge in luxury in this overwater villa in the Maldives with stunning views of the Indian Ocean.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8bGFrZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 6000,
//     location: "Maldives",
//     country: "Maldives",
//   },
//   {
//     title: "Ski Chalet in Aspen",
//     description:
//       "Hit the slopes in style with this luxurious ski chalet in the world-famous Aspen ski resort.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGxha2V8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 4000,
//     location: "Aspen",
//     country: "United States",
//   },
//   {
//     title: "Secluded Beach House in Costa Rica",
//     description:
//       "Escape to a secluded beach house on the Pacific coast of Costa Rica. Surf, relax, and unwind.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1800,
//     location: "Costa Rica",
//     country: "Costa Rica",
//   },
//     {
//     title: "Cliffside Villa in Santorini",
//     description:
//       "Wake up to stunning caldera views in this luxury cliffside villa with a private jacuzzi.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1505731132164-cca7f1a8d14b?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 3200,
//     location: "Santorini",
//     country: "Greece",
//   },
//   {
//     title: "Jungle Resort in Bali",
//     description:
//       "Stay deep in Bali's lush rainforest with an infinity pool overlooking the Ubud valley.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1551887414-562ff8d61f21?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2100,
//     location: "Ubud",
//     country: "Indonesia",
//   },
//   {
//     title: "Snow Cabin in Iceland",
//     description:
//       "Experience northern lights from this modern glass-roof cabin in Iceland's snowy wilderness.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2700,
//     location: "Reykjavik",
//     country: "Iceland",
//   },
//   {
//     title: "Island Hut in Philippines",
//     description:
//       "Live by turquoise waters in this beautiful bamboo hut on a peaceful island beach.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 900,
//     location: "Palawan",
//     country: "Philippines",
//   },
//   {
//     title: "Forest Cabin in Norway",
//     description:
//       "A peaceful red cabin surrounded by pine trees and snow — a perfect Scandinavian escape.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1529421308418-44d6e3a1ef2e?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1800,
//     location: "Bergen",
//     country: "Norway",
//   },
//   {
//     title: "Modern Glass House Retreat",
//     description:
//       "A fully glass-walled house with panoramic views of rolling hills and open skies.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1538947151057-dfe933d68814?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 3500,
//     location: "Auckland",
//     country: "New Zealand",
//   },
//   {
//     title: "Floating Bungalow in Vietnam",
//     description:
//       "Stay above emerald waters surrounded by dramatic limestone cliffs of Ha Long Bay.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1600,
//     location: "Ha Long Bay",
//     country: "Vietnam",
//   },
//   {
//     title: "Desert Camp in Morocco",
//     description:
//       "A luxury Berber-style tent camp under the starry Sahara sky — a magical desert experience.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1499244571948-7ccddb3583f1?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1400,
//     location: "Merzouga",
//     country: "Morocco",
//   },
//   {
//     title: "Coastal Lighthouse Stay",
//     description:
//       "Stay inside a real lighthouse on a rugged cliffside with breathtaking ocean views.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1700,
//     location: "Cornwall",
//     country: "United Kingdom",
//   },
//   {
//     title: "Tropical Eco-Hut in Brazil",
//     description:
//       "An eco-friendly jungle hut surrounded by colorful birds, waterfalls, and hiking trails.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 950,
//     location: "Rio de Janeiro",
//     country: "Brazil",
//   },
//   {
//     title: "Ski Lodge in Canada",
//     description:
//       "A cozy wooden lodge beside frozen lakes and mountains — perfect for winter sports lovers.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1900,
//     location: "Whistler",
//     country: "Canada",
//   },
//   {
//     title: "Cliff Hut in Faroe Islands",
//     description:
//       "A remote cliff hut overlooking the wild North Atlantic — a dream for adventure seekers.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 2300,
//     location: "Faroe Islands",
//     country: "Denmark",
//   },
//   {
//     title: "Countryside Farmhouse",
//     description:
//       "Relax in a peaceful farmhouse with open fields, fresh air, and homegrown meals.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1522706604294-ff1927f6dd0d?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1100,
//     location: "Tuscany",
//     country: "Italy",
//   },
//   {
//     title: "Lakeview Cottage in Finland",
//     description:
//       "A quiet cottage by a frozen lake with a private sauna — the perfect winter retreat.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1500048993953-d23a436266cf?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1500,
//     location: "Lapland",
//     country: "Finland",
//   },
//   {
//     title: "Himalayan Mountain Cabin",
//     description:
//       "Breathtaking snowy peaks, peaceful nature, and a cozy wooden cabin high in the Himalayas.",
//     image: {
//       filename: "listingimage",
//       url: "https://images.unsplash.com/photo-1515688594390-b649af70d282?auto=format&fit=crop&w=800&q=60",
//     },
//     price: 1300,
//     location: "Manali",
//     country: "India",
//   },

// ];

// module.exports = { data: sampleListings };




