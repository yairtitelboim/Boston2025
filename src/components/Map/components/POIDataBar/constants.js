// All POI categories
export const CATEGORIES = [
  'restaurants',
  'cafes',
  'bars',
  'shops',
  'cultural',
  'parks',
  'education',
  'healthcare',
  'transportation'
];

// Sample POI data for demonstration when OSM data is not available
export const SAMPLE_POI_DATA = {
  restaurants: [
    { id: 1, name: "Harbor Bistro", type: "Fine Dining", rating: 4.8, popularity: 92, coordinates: [-71.0495, 42.3601] },
    { id: 2, name: "Seafood Central", type: "Seafood", rating: 4.5, popularity: 88, coordinates: [-71.0515, 42.3585] },
    { id: 3, name: "The Waterfront Café", type: "Casual", rating: 4.2, popularity: 75, coordinates: [-71.0375, 42.3615] },
    { id: 4, name: "Ocean Grill", type: "Fine Dining", rating: 4.6, popularity: 82, coordinates: [-71.0455, 42.3555] },
    { id: 5, name: "Harbor View Restaurant", type: "Seafood", rating: 4.3, popularity: 78, coordinates: [-71.0335, 42.3645] },
    { id: 6, name: "Dockside Diner", type: "Casual", rating: 4.0, popularity: 70, coordinates: [-71.0495, 42.3515] },
    { id: 7, name: "Financial District Bistro", type: "Fine Dining", rating: 4.7, popularity: 89, coordinates: [-71.0569, 42.3555] },
    { id: 8, name: "Chinatown Express", type: "Chinese", rating: 4.2, popularity: 83, coordinates: [-71.0608, 42.3512] },
    { id: 9, name: "North End Italian", type: "Italian", rating: 4.9, popularity: 95, coordinates: [-71.0543, 42.3647] },
    { id: 10, name: "Seaport Lobster", type: "Seafood", rating: 4.6, popularity: 91, coordinates: [-71.0477, 42.3518] },
    { id: 11, name: "Back Bay Grill", type: "American", rating: 4.4, popularity: 86, coordinates: [-71.0772, 42.3503] },
    { id: 12, name: "South Station Cafe", type: "Cafe", rating: 4.1, popularity: 77, coordinates: [-71.0552, 42.3518] }
  ],
  cafes: [
    { id: 1, name: "Waterfront Coffee", type: "Coffee Shop", rating: 4.7, popularity: 90, coordinates: [-71.0485, 42.3605] },
    { id: 2, name: "Harbor Espresso", type: "Coffee Shop", rating: 4.4, popularity: 85, coordinates: [-71.0525, 42.3595] },
    { id: 3, name: "North End Café", type: "Coffee Shop", rating: 4.6, popularity: 88, coordinates: [-71.0545, 42.3645] }
  ],
  bars: [
    { id: 1, name: "Waterfront Brewery", type: "Pub", rating: 4.5, popularity: 87, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Harbor Cocktail Lounge", type: "Cocktail Bar", rating: 4.8, popularity: 92, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Downtown Wine Bar", type: "Wine Bar", rating: 4.6, popularity: 89, coordinates: [-71.0565, 42.3550] }
  ],
  shops: [
    { id: 1, name: "Seaport Market", type: "Grocery", rating: 4.3, popularity: 82, coordinates: [-71.0475, 42.3605] },
    { id: 2, name: "Harbor Boutique", type: "Clothing", rating: 4.6, popularity: 88, coordinates: [-71.0515, 42.3585] },
    { id: 3, name: "Downtown Books", type: "Bookstore", rating: 4.5, popularity: 86, coordinates: [-71.0555, 42.3555] }
  ],
  cultural: [
    { id: 1, name: "Harbor View Theater", type: "Performing Arts", rating: 4.6, popularity: 85, coordinates: [-71.0685, 42.3605] },
    { id: 2, name: "Maritime Museum", type: "Museum", rating: 4.3, popularity: 70, coordinates: [-71.0505, 42.3595] },
    { id: 3, name: "Harbor IMAX", type: "Cinema", rating: 4.5, popularity: 88, coordinates: [-71.0465, 42.3525] },
    { id: 4, name: "Boston Aquarium", type: "Attraction", rating: 4.7, popularity: 92, coordinates: [-71.0495, 42.3595] },
    { id: 5, name: "Harbor Park", type: "Recreation", rating: 4.1, popularity: 75, coordinates: [-71.0425, 42.3655] },
    { id: 6, name: "Symphony Hall", type: "Performing Arts", rating: 4.8, popularity: 89, coordinates: [-71.0856, 42.3429] },
    { id: 7, name: "Museum of Fine Arts", type: "Museum", rating: 4.7, popularity: 88, coordinates: [-71.0941, 42.3397] },
    { id: 8, name: "Charles Cinema", type: "Cinema", rating: 4.2, popularity: 80, coordinates: [-71.0699, 42.3512] },
    { id: 9, name: "Boston Common", type: "Park", rating: 4.5, popularity: 92, coordinates: [-71.0661, 42.3551] },
    { id: 10, name: "Faneuil Hall", type: "Historic Site", rating: 4.6, popularity: 94, coordinates: [-71.0554, 42.3606] }
  ],
  parks: [
    { id: 1, name: "Harbor Park", type: "Urban Park", rating: 4.5, popularity: 89, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Waterfront Gardens", type: "Garden", rating: 4.7, popularity: 90, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Boston Common", type: "Urban Park", rating: 4.8, popularity: 95, coordinates: [-71.0661, 42.3551] }
  ],
  education: [
    { id: 1, name: "Harbor Elementary", type: "School", rating: 4.2, popularity: 78, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Boston University", type: "University", rating: 4.6, popularity: 92, coordinates: [-71.1097, 42.3505] },
    { id: 3, name: "Waterfront Library", type: "Library", rating: 4.4, popularity: 86, coordinates: [-71.0515, 42.3590] }
  ],
  healthcare: [
    { id: 1, name: "Harbor Medical Center", type: "Hospital", rating: 4.5, popularity: 88, coordinates: [-71.0495, 42.3610] },
    { id: 2, name: "Waterfront Clinic", type: "Clinic", rating: 4.3, popularity: 82, coordinates: [-71.0515, 42.3590] },
    { id: 3, name: "Downtown Pharmacy", type: "Pharmacy", rating: 4.2, popularity: 80, coordinates: [-71.0555, 42.3555] }
  ],
  transportation: [
    { id: 1, name: "Ferry Terminal", type: "Water Transit", rating: 4.4, popularity: 90, coordinates: [-71.0475, 42.3615] },
    { id: 2, name: "Harbor Shuttle Stop", type: "Public Transit", rating: 4.1, popularity: 78, coordinates: [-71.0525, 42.3575] },
    { id: 3, name: "Water Taxi Dock", type: "Water Transit", rating: 4.3, popularity: 85, coordinates: [-71.0455, 42.3635] },
    { id: 4, name: "Harborwalk Bike Rental", type: "Bike Share", rating: 4.2, popularity: 75, coordinates: [-71.0515, 42.3495] },
    { id: 5, name: "Harbor Bus Terminal", type: "Public Transit", rating: 4.0, popularity: 70, coordinates: [-71.0515, 42.3665] },
    { id: 6, name: "South Station", type: "Train Station", rating: 4.5, popularity: 93, coordinates: [-71.0551, 42.3521] },
    { id: 7, name: "North Station", type: "Train Station", rating: 4.4, popularity: 89, coordinates: [-71.0617, 42.3663] },
    { id: 8, name: "Downtown Crossing T", type: "Subway", rating: 4.0, popularity: 88, coordinates: [-71.0602, 42.3556] },
    { id: 9, name: "Copley Square T", type: "Subway", rating: 4.1, popularity: 85, coordinates: [-71.0778, 42.3504] },
    { id: 10, name: "Haymarket T", type: "Subway", rating: 3.9, popularity: 82, coordinates: [-71.0582, 42.3633] },
    { id: 11, name: "Logan Airport Shuttle", type: "Airport Shuttle", rating: 4.2, popularity: 87, coordinates: [-71.0465, 42.3668] },
    { id: 12, name: "Seaport Bike Share", type: "Bike Share", rating: 4.3, popularity: 79, coordinates: [-71.0477, 42.3526] }
  ]
}; 