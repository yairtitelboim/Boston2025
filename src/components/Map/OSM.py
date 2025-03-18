import overpy
import json
import time
import os
from math import ceil

def download_la_transit_data():
    api = overpy.Overpass(url='https://overpass.kumi.systems/api/interpreter')
    
    # LA coordinates split into smaller chunks
    lat_min, lon_min = 33.7037, -118.6682  # SW corner
    lat_max, lon_max = 34.3373, -118.1553  # NE corner
    
    # Split area into 4x4 grid
    lat_step = (lat_max - lat_min) / 4
    lon_step = (lon_max - lon_min) / 4
    
    # Initialize feature collections for each category
    transit_features = {
        'public_transit': {
            'stops': [],
            'routes': [],
            'stations': []
        },
        'bike_infrastructure': {
            'lanes': [],
            'paths': [],
            'parking': []
        },
        'pedestrian': {
            'paths': [],
            'crossings': []
        }
    }
    
    print("Downloading LA transit data from OpenStreetMap in chunks...")
    
    for i in range(4):
        for j in range(4):
            chunk_lat_min = lat_min + (i * lat_step)
            chunk_lat_max = lat_min + ((i + 1) * lat_step)
            chunk_lon_min = lon_min + (j * lon_step)
            chunk_lon_max = lon_min + ((j + 1) * lon_step)
            
            bbox = f"{chunk_lat_min},{chunk_lon_min},{chunk_lat_max},{chunk_lon_max}"
            
            # Query for public transit features
            transit_query = f"""
            [out:json][timeout:300];
            (
              // Public Transit Stops and Stations
              node["public_transport"="stop_position"]({bbox});
              node["public_transport"="station"]({bbox});
              node["railway"="station"]({bbox});
              node["railway"="stop"]({bbox});
              
              // Bus Stops
              node["highway"="bus_stop"]({bbox});
              
              // Transit Routes
              way["railway"]({bbox});
              way["route"="train"]({bbox});
              way["route"="subway"]({bbox});
              way["route"="light_rail"]({bbox});
              way["route"="tram"]({bbox});
              
              // Bike Infrastructure
              way["highway"="cycleway"]({bbox});
              way["bicycle"="designated"]({bbox});
              way["cycleway"]({bbox});
              node["amenity"="bicycle_parking"]({bbox});
              
              // Pedestrian Infrastructure
              way["highway"="footway"]({bbox});
              way["highway"="pedestrian"]({bbox});
              way["highway"="path"]({bbox});
              node["crossing"="traffic_signals"]({bbox});
              way["area:highway"="pedestrian"]({bbox});
            );
            out body;
            >;
            out skel qt;
            """
            
            max_retries = 3
            retry_delay = 10  # seconds
            
            for attempt in range(max_retries):
                try:
                    print(f"Downloading chunk {(i*4)+j+1}/16...")
                    result = api.query(transit_query)
                    
                    # Process nodes (stops, stations, etc.)
                    for node in result.nodes:
                        try:
                            feature = {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Point',
                                    'coordinates': [float(node.lon), float(node.lat)]
                                },
                                'properties': node.tags
                            }
                            
                            # Categorize nodes
                            if any(tag in node.tags for tag in ['public_transport', 'railway', 'highway']) and \
                               any(val in node.tags.values() for val in ['stop_position', 'station', 'bus_stop']):
                                if node.tags.get('railway') == 'station':
                                    transit_features['public_transit']['stations'].append(feature)
                                else:
                                    transit_features['public_transit']['stops'].append(feature)
                            elif 'amenity' in node.tags and node.tags['amenity'] == 'bicycle_parking':
                                transit_features['bike_infrastructure']['parking'].append(feature)
                            elif 'crossing' in node.tags:
                                transit_features['pedestrian']['crossings'].append(feature)
                                
                        except Exception as e:
                            print(f"Error processing node {node.id}: {str(e)}")
                            continue
                    
                    # Process ways (routes, paths, etc.)
                    for way in result.ways:
                        try:
                            coords = [[float(node.lon), float(node.lat)] for node in way.nodes]
                            
                            feature = {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'LineString',
                                    'coordinates': coords
                                },
                                'properties': way.tags
                            }
                            
                            # Categorize ways
                            if any(tag in way.tags for tag in ['railway', 'route']) and \
                               any(val in way.tags.values() for val in ['rail', 'train', 'subway', 'light_rail', 'tram']):
                                transit_features['public_transit']['routes'].append(feature)
                            elif any(tag in way.tags for tag in ['cycleway', 'bicycle']):
                                transit_features['bike_infrastructure']['lanes'].append(feature)
                            elif way.tags.get('highway') == 'cycleway':
                                transit_features['bike_infrastructure']['paths'].append(feature)
                            elif any(val in way.tags.values() for val in ['footway', 'pedestrian', 'path']):
                                transit_features['pedestrian']['paths'].append(feature)
                            
                        except Exception as e:
                            print(f"Error processing way {way.id}: {str(e)}")
                            continue
                    
                    print(f"Processed features in chunk {(i*4)+j+1}")
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
    
    # Create separate GeoJSON files for each category
    output_files = {}
    for category, subcategories in transit_features.items():
        for subcategory, features in subcategories.items():
            if features:  # Only create files for non-empty feature collections
                geojson = {
                    'type': 'FeatureCollection',
                    'features': features
                }
                
                filename = f'la_{category}_{subcategory}.geojson'
                with open(os.path.join('public', 'data', 'osm', filename), 'w') as f:
                    json.dump(geojson, f)
                output_files[f"{category}_{subcategory}"] = os.path.abspath(os.path.join('public', 'data', 'osm', filename))
    
    print("\nDownload complete!")
    print("Files created:")
    for category, subcategories in transit_features.items():
        for subcategory, features in subcategories.items():
            if features:
                filename = f'la_{category}_{subcategory}.geojson'
                filepath = os.path.join('public', 'data', 'osm', filename)
                print(f"\n{category} - {subcategory}:")
                print(f"- File: {os.path.abspath(filepath)}")
                print(f"- Features: {len(features)}")

if __name__ == "__main__":
    download_la_transit_data()
