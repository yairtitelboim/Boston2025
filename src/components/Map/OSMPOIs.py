import overpy
import json
import time
import os
from math import ceil

def download_osm_pois():
    api = overpy.Overpass(url='https://overpass.kumi.systems/api/interpreter')
    
    # Boston coordinates
    lat_min, lon_min = 42.3000, -71.1000  # SW corner
    lat_max, lon_max = 42.4000, -71.0000  # NE corner
    
    # Split area into 3x3 grid for better performance
    lat_step = (lat_max - lat_min) / 3
    lon_step = (lon_max - lon_min) / 3
    
    # Initialize feature collections for different POI categories
    poi_features = {
        'restaurants': [],
        'cafes': [],
        'bars': [],
        'shops': [],
        'cultural': [],
        'parks': [],
        'education': [],
        'healthcare': [],
        'transportation': [],
        'other': []
    }
    
    print("Downloading Boston POI data from OpenStreetMap in chunks...")
    
    for i in range(3):
        for j in range(3):
            chunk_lat_min = lat_min + (i * lat_step)
            chunk_lat_max = lat_min + ((i + 1) * lat_step)
            chunk_lon_min = lon_min + (j * lon_step)
            chunk_lon_max = lon_min + ((j + 1) * lon_step)
            
            bbox = f"{chunk_lat_min},{chunk_lon_min},{chunk_lat_max},{chunk_lon_max}"
            
            # Query for POIs
            poi_query = f"""
            [out:json][timeout:300];
            (
              // Restaurants and Food
              node["amenity"="restaurant"]({bbox});
              node["amenity"="cafe"]({bbox});
              node["amenity"="bar"]({bbox});
              node["amenity"="fast_food"]({bbox});
              
              // Shops and Services
              node["shop"]({bbox});
              node["amenity"="bank"]({bbox});
              node["amenity"="post_office"]({bbox});
              
              // Cultural Venues
              node["amenity"="museum"]({bbox});
              node["amenity"="theatre"]({bbox});
              node["amenity"="cinema"]({bbox});
              node["amenity"="arts_centre"]({bbox});
              node["amenity"="gallery"]({bbox});
              
              // Parks and Recreation
              node["leisure"="park"]({bbox});
              node["leisure"="garden"]({bbox});
              node["leisure"="sports_centre"]({bbox});
              node["leisure"="fitness_centre"]({bbox});
              
              // Education
              node["amenity"="school"]({bbox});
              node["amenity"="university"]({bbox});
              node["amenity"="college"]({bbox});
              
              // Healthcare
              node["amenity"="hospital"]({bbox});
              node["amenity"="clinic"]({bbox});
              node["amenity"="pharmacy"]({bbox});
              
              // Transportation
              node["amenity"="bus_station"]({bbox});
              node["amenity"="subway_entrance"]({bbox});
              node["amenity"="taxi"]({bbox});
            );
            out body;
            >;
            out skel qt;
            """
            
            max_retries = 3
            retry_delay = 10  # seconds
            
            for attempt in range(max_retries):
                try:
                    print(f"Downloading chunk {(i*3)+j+1}/9...")
                    result = api.query(poi_query)
                    
                    # Process nodes
                    for node in result.nodes:
                        try:
                            feature = {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': [float(node.lon), float(node.lat)]
                                },
                                'properties': {
                                    'name': node.tags.get('name', 'Unnamed'),
                                    'type': node.tags.get('amenity') or node.tags.get('shop') or node.tags.get('leisure'),
                                    'category': categorize_poi(node.tags),
                                    'description': node.tags.get('description', ''),
                                    'website': node.tags.get('website', ''),
                                    'phone': node.tags.get('phone', ''),
                                    'opening_hours': node.tags.get('opening_hours', ''),
                                    'wheelchair': node.tags.get('wheelchair', ''),
                                    'osm_id': node.id,
                                    'osm_type': 'node',
                                    'tags': node.tags
                                }
                            }
                            
                            # Add to appropriate category
                            category = categorize_poi(node.tags)
                            if category in poi_features:
                                poi_features[category].append(feature)
                            else:
                                poi_features['other'].append(feature)
                                
                        except Exception as e:
                            print(f"Error processing node {node.id}: {str(e)}")
                            continue
                    
                    print(f"Processed features in chunk {(i*3)+j+1}")
                    break
                    
                except overpy.exception.OverpassGatewayTimeout:
                    if attempt < max_retries - 1:
                        print(f"Timeout error, retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        print(f"Failed to download chunk after {max_retries} attempts, skipping...")
                
                except Exception as e:
                    print(f"Error downloading chunk: {str(e)}")
                    break
                
            time.sleep(2)
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.join('public', 'data', 'osm'), exist_ok=True)
    
    # Create separate GeoJSON files for each category
    output_files = {}
    for category, features in poi_features.items():
        if features:  # Only create files for non-empty feature collections
            geojson = {
                'type': 'FeatureCollection',
                'features': features
            }
            
            filename = f'{category}.geojson'
            filepath = os.path.join('public', 'data', 'osm', filename)
            with open(filepath, 'w') as f:
                json.dump(geojson, f)
            output_files[category] = os.path.abspath(filepath)
    
    print("\nDownload complete!")
    print("Files created:")
    for category, filepath in output_files.items():
        print(f"\n{category}:")
        print(f"- File: {filepath}")
        print(f"- Features: {len(poi_features[category])}")

def categorize_poi(tags):
    """Categorize a POI based on its tags"""
    amenity = tags.get('amenity', '')
    shop = tags.get('shop', '')
    leisure = tags.get('leisure', '')
    
    # Restaurants and Food
    if amenity in ['restaurant', 'cafe', 'bar', 'fast_food']:
        if amenity == 'restaurant':
            return 'restaurants'
        elif amenity == 'cafe':
            return 'cafes'
        elif amenity == 'bar':
            return 'bars'
        else:
            return 'restaurants'
    
    # Shops and Services
    if shop or amenity in ['bank', 'post_office']:
        return 'shops'
    
    # Cultural Venues
    if amenity in ['museum', 'theatre', 'cinema', 'arts_centre', 'gallery']:
        return 'cultural'
    
    # Parks and Recreation
    if leisure in ['park', 'garden', 'sports_centre', 'fitness_centre']:
        return 'parks'
    
    # Education
    if amenity in ['school', 'university', 'college']:
        return 'education'
    
    # Healthcare
    if amenity in ['hospital', 'clinic', 'pharmacy']:
        return 'healthcare'
    
    # Transportation
    if amenity in ['bus_station', 'subway_entrance', 'taxi']:
        return 'transportation'
    
    return 'other'

if __name__ == "__main__":
    download_osm_pois() 