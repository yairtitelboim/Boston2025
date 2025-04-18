import overpy
import json
import time
import os
from math import ceil

def download_boston_buildings():
    api = overpy.Overpass(url='https://overpass.kumi.systems/api/interpreter')
    
    # Boston coordinates split into smaller chunks for better handling
    # These coordinates cover downtown Boston and surrounding areas
    lat_min, lon_min = 42.32, -71.15  # SW corner
    lat_max, lon_max = 42.40, -71.00  # NE corner
    
    # Split area into smaller chunks for better handling
    grid_size = 4  # Smaller grid for faster processing
    lat_step = (lat_max - lat_min) / grid_size
    lon_step = (lon_max - lon_min) / grid_size
    
    buildings = []
    total_chunks = grid_size * grid_size
    processed_chunks = 0

    print(f"Starting Boston buildings download in {total_chunks} chunks...")
    print(f"Area: {lat_min},{lon_min} to {lat_max},{lon_max}")
    print(f"Chunk size: ~{lat_step:.4f}° x {lon_step:.4f}°\n")
    
    for i in range(grid_size):
        for j in range(grid_size):
            chunk_lat_min = lat_min + (i * lat_step)
            chunk_lat_max = lat_min + ((i + 1) * lat_step)
            chunk_lon_min = lon_min + (j * lon_step)
            chunk_lon_max = lon_min + ((j + 1) * lon_step)
            
            bbox = f"{chunk_lat_min},{chunk_lon_min},{chunk_lat_max},{chunk_lon_max}"
            
            # Query specifically for buildings with height or level data for better 3D rendering
            building_query = f"""
            [out:json][timeout:300];
            (
              way["building"]["height"]({bbox});
              way["building"]["building:levels"]({bbox});
              way["building"]({bbox});
              relation["building"]({bbox});
            );
            (._;>;);
            out body;
            """
            
            max_retries = 3
            retry_delay = 10  # seconds
            
            for attempt in range(max_retries):
                try:
                    processed_chunks += 1
                    print(f"\nProcessing chunk {processed_chunks}/{total_chunks} ({(processed_chunks/total_chunks)*100:.1f}%)")
                    print(f"Coordinates: {bbox}")
                    
                    result = api.query(building_query)
                    chunk_buildings = []
                    
                    # Create a way lookup dictionary
                    way_lookup = {way.id: way for way in result.ways}
                    
                    # Process standalone ways (buildings that are not part of relations)
                    for way in result.ways:
                        try:
                            # Skip ways that don't have building tags
                            if not way.tags.get('building'):
                                continue
                                
                            coords = [[float(node.lon), float(node.lat)] for node in way.nodes]
                            if not coords or len(coords) < 3:  # Need at least 3 points for a polygon
                                continue
                                
                            # Close the polygon if it's not closed
                            if coords[0] != coords[-1]:
                                coords.append(coords[0])
                                
                            # Get height information or estimate from levels
                            height = 0
                            if 'height' in way.tags:
                                try:
                                    height = float(way.tags.get('height', 0))
                                except ValueError:
                                    # Some height values might be like "20 m" instead of just "20"
                                    height_str = way.tags.get('height', '0')
                                    height_str = ''.join(c for c in height_str if c.isdigit() or c == '.')
                                    try:
                                        height = float(height_str) if height_str else 0
                                    except ValueError:
                                        height = 0
                            
                            levels = 0
                            if 'building:levels' in way.tags:
                                try:
                                    levels = float(way.tags.get('building:levels', 0))
                                except ValueError:
                                    levels_str = way.tags.get('building:levels', '0')
                                    levels_str = ''.join(c for c in levels_str if c.isdigit() or c == '.')
                                    try:
                                        levels = float(levels_str) if levels_str else 0
                                    except ValueError:
                                        levels = 0
                            
                            # If we have levels but no height, estimate height (3m per level)
                            if height == 0 and levels > 0:
                                height = levels * 3
                            # If we have neither, use default height based on building type
                            elif height == 0:
                                building_type = way.tags.get('building', 'yes')
                                if building_type in ['apartment', 'residential']:
                                    height = 10  # Default apartment height
                                elif building_type == 'commercial':
                                    height = 12  # Default commercial building height
                                elif building_type in ['industrial', 'warehouse']:
                                    height = 8  # Default industrial height
                                else:
                                    height = 5  # Default general building height
                            
                            # Get building name and type for better identification
                            name = way.tags.get('name', '')
                            building_type = way.tags.get('building', 'yes')
                            
                            feature = {
                                'type': 'Feature',
                                'geometry': {
                                    'type': 'Polygon',
                                    'coordinates': [coords]
                                },
                                'properties': {
                                    'height': height,
                                    'levels': levels,
                                    'id': f"way/{way.id}",
                                    'building': building_type,
                                    'name': name
                                }
                            }
                            chunk_buildings.append(feature)
                            
                        except Exception as e:
                            print(f"Error processing way {way.id}: {str(e)}")
                            continue
                    
                    # Process relations (some buildings are relations)
                    for relation in result.relations:
                        if 'building' not in relation.tags:
                            continue
                            
                        try:
                            # Get outer ways of the building
                            outer_ways = []
                            for member in relation.members:
                                if member.role == 'outer':
                                    try:
                                        if isinstance(member, overpy.RelationWay):
                                            way_id = member.ref.id if hasattr(member.ref, 'id') else member.ref
                                            if way_id in way_lookup:
                                                outer_ways.append(way_lookup[way_id])
                                    except Exception:
                                        continue
                            
                            if not outer_ways:
                                continue
                                
                            # Get height information
                            height = 0
                            if 'height' in relation.tags:
                                try:
                                    height = float(relation.tags.get('height', 0))
                                except ValueError:
                                    height_str = relation.tags.get('height', '0')
                                    height_str = ''.join(c for c in height_str if c.isdigit() or c == '.')
                                    try:
                                        height = float(height_str) if height_str else 0
                                    except ValueError:
                                        height = 0
                            
                            levels = 0
                            if 'building:levels' in relation.tags:
                                try:
                                    levels = float(relation.tags.get('building:levels', 0))
                                except ValueError:
                                    levels_str = relation.tags.get('building:levels', '0')
                                    levels_str = ''.join(c for c in levels_str if c.isdigit() or c == '.')
                                    try:
                                        levels = float(levels_str) if levels_str else 0
                                    except ValueError:
                                        levels = 0
                            
                            if height == 0 and levels > 0:
                                height = levels * 3
                            elif height == 0:
                                building_type = relation.tags.get('building', 'yes')
                                if building_type in ['apartment', 'residential']:
                                    height = 10
                                elif building_type == 'commercial':
                                    height = 12
                                elif building_type in ['industrial', 'warehouse']:
                                    height = 8
                                else:
                                    height = 5
                            
                            name = relation.tags.get('name', '')
                            building_type = relation.tags.get('building', 'yes')
                            
                            # Process each outer way
                            for way in outer_ways:
                                try:
                                    coords = [[float(node.lon), float(node.lat)] for node in way.nodes]
                                    if not coords or len(coords) < 3:
                                        continue
                                        
                                    if coords[0] != coords[-1]:
                                        coords.append(coords[0])
                                    
                                    feature = {
                                        'type': 'Feature',
                                        'geometry': {
                                            'type': 'Polygon',
                                            'coordinates': [coords]
                                        },
                                        'properties': {
                                            'height': height,
                                            'levels': levels,
                                            'id': f"relation/{relation.id}/way/{way.id}",
                                            'building': building_type,
                                            'name': name
                                        }
                                    }
                                    chunk_buildings.append(feature)
                                except Exception as e:
                                    print(f"Error processing relation way: {str(e)}")
                                    continue
                            
                        except Exception as e:
                            print(f"Error processing relation: {str(e)}")
                            continue
                    
                    print(f"Found {len(chunk_buildings)} buildings in chunk")
                    buildings.extend(chunk_buildings)
                    
                    # Add delay between chunks to avoid rate limiting
                    time.sleep(2)
                    break
                    
                except overpy.exception.OverpassGatewayTimeout:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        print(f"Timeout error, retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        print(f"Failed to download chunk after {max_retries} attempts, skipping...")
                        
                except Exception as e:
                    print(f"Error downloading chunk: {str(e)}")
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        print(f"Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                    else:
                        print("Skipping chunk due to repeated errors")
                        break
    
    # Save the complete building data
    if buildings:
        geojson = {
            'type': 'FeatureCollection',
            'features': buildings
        }
        
        output_dir = os.path.join('public', 'data', 'osm')
        os.makedirs(output_dir, exist_ok=True)
        
        output_file = os.path.join(output_dir, 'boston_buildings_3d.geojson')
        with open(output_file, 'w') as f:
            json.dump(geojson, f)
        
        print(f"\nDownload complete!")
        print(f"Total buildings: {len(buildings)}")
        print(f"Output file: {os.path.abspath(output_file)}")
    else:
        print("\nNo buildings were downloaded successfully")

if __name__ == "__main__":
    download_boston_buildings() 