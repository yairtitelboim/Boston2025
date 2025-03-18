import React, { useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';
import mapboxgl from 'mapbox-gl';
import LayerToggle from './components/LayerToggle';
import Legend from './components/Legend';
import DocumentInsightPanel from './components/DocumentInsightPanel';

const Map = () => {
  const [showDevelopmentPotential, setShowDevelopmentPotential] = useState(false);
  const [showInfrastructureCapacity, setShowInfrastructureCapacity] = useState(false);
  const [showTransitAccess, setShowTransitAccess] = useState(false);
  const [showAmenities, setShowAmenities] = useState(false);
  const [showAdaptiveReuse, setShowAdaptiveReuse] = useState(false);

  // New state for document insights
  const [currentDocument, setCurrentDocument] = useState(null);
  const [showDocumentInsights, setShowDocumentInsights] = useState(false);
  const [documentLayers, setDocumentLayers] = useState({});

  const map = React.useRef(null);
  const mapContainer = React.useRef(null);

  useEffect(() => {
    if (!map.current) return;

    // Initialize planning data layers
    if (!map.current.getSource('development-potential')) {
      map.current.addSource('development-potential', {
        type: 'geojson',
        data: '/data/development_potential.geojson'
      });
      map.current.addLayer({
        id: 'development-potential',
        type: 'fill',
        source: 'development-potential',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'potential_score'],
            0, '#fee5d9',
            5, '#fcae91',
            10, '#fb6a4a',
            15, '#de2d26',
            20, '#a50f15'
          ],
          'fill-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      });
    }

    if (!map.current.getSource('infrastructure-capacity')) {
      map.current.addSource('infrastructure-capacity', {
        type: 'geojson',
        data: '/data/infrastructure_capacity.geojson'
      });
      map.current.addLayer({
        id: 'infrastructure-capacity',
        type: 'fill',
        source: 'infrastructure-capacity',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'capacity_score'],
            0, '#edf8e9',
            5, '#bae4b3',
            10, '#74c476',
            15, '#31a354',
            20, '#006d2c'
          ],
          'fill-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      });
    }

    if (!map.current.getSource('transit-access')) {
      map.current.addSource('transit-access', {
        type: 'geojson',
        data: '/data/transit_access.geojson'
      });
      map.current.addLayer({
        id: 'transit-access',
        type: 'fill',
        source: 'transit-access',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'access_score'],
            0, '#f2f0f7',
            5, '#cbc9e2',
            10, '#9e9ac8',
            15, '#756bb1',
            20, '#54278f'
          ],
          'fill-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      });
    }

    if (!map.current.getSource('amenities')) {
      map.current.addSource('amenities', {
        type: 'geojson',
        data: '/data/amenities.geojson'
      });
      map.current.addLayer({
        id: 'amenities',
        type: 'circle',
        source: 'amenities',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'type'],
            'grocery', '#1f77b4',
            'school', '#ff7f0e',
            'park', '#2ca02c',
            'healthcare', '#d62728',
            'retail', '#9467bd',
            '#7f7f7f'  // default color
          ],
          'circle-opacity': 0.8
        },
        layout: {
          visibility: 'none'
        }
      });
    }

    if (!map.current.getSource('adaptive-reuse')) {
      map.current.addSource('adaptive-reuse', {
        type: 'geojson',
        data: '/data/adaptive_reuse.geojson'
      });
      map.current.addLayer({
        id: 'adaptive-reuse',
        type: 'fill',
        source: 'adaptive-reuse',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'reuse_potential'],
            0, '#eff3ff',
            5, '#bdd7e7',
            10, '#6baed6',
            15, '#3182bd',
            20, '#08519c'
          ],
          'fill-opacity': 0.7
        },
        layout: {
          visibility: 'none'
        }
      });
    }

    // Function to load document data
    const loadDocumentData = async (docId) => {
      try {
        // Load analysis data
        const analysisResponse = await fetch(`/processed_planning_docs/single/${docId}_analysis.json`);
        const analysis = await analysisResponse.json();

        // Load GeoJSON data
        const geojsonResponse = await fetch(`/processed_planning_docs/single/${docId}_geo.json`);
        const geojson = await geojsonResponse.json();

        // Add source and layers for this document
        if (!map.current.getSource(docId)) {
          map.current.addSource(docId, {
            type: 'geojson',
            data: geojson
          });

          // Add development potential layer
          map.current.addLayer({
            id: `${docId}-development`,
            type: 'circle',
            source: docId,
            filter: ['==', ['get', 'type'], 'development'],
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'potential_score'],
                0, '#fee5d9',
                20, '#a50f15'
              ],
              'circle-opacity': 0.7
            },
            layout: {
              visibility: 'none'
            }
          });

          // Add infrastructure capacity layer
          map.current.addLayer({
            id: `${docId}-infrastructure`,
            type: 'circle',
            source: docId,
            filter: ['==', ['get', 'type'], 'infrastructure'],
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'capacity_score'],
                0, '#edf8e9',
                20, '#006d2c'
              ],
              'circle-opacity': 0.7
            },
            layout: {
              visibility: 'none'
            }
          });

          // Add transit access layer
          map.current.addLayer({
            id: `${docId}-transit`,
            type: 'circle',
            source: docId,
            filter: ['==', ['get', 'type'], 'transit'],
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'access_score'],
                0, '#f2f0f7',
                20, '#54278f'
              ],
              'circle-opacity': 0.7
            },
            layout: {
              visibility: 'none'
            }
          });

          // Add amenities layer
          map.current.addLayer({
            id: `${docId}-amenities`,
            type: 'circle',
            source: docId,
            filter: ['==', ['get', 'type'], 'amenity'],
            paint: {
              'circle-radius': 6,
              'circle-color': [
                'match',
                ['get', 'amenityType'],
                'grocery', '#1f77b4',
                'school', '#ff7f0e',
                'park', '#2ca02c',
                'healthcare', '#d62728',
                'retail', '#9467bd',
                '#7f7f7f'
              ],
              'circle-opacity': 0.8
            },
            layout: {
              visibility: 'none'
            }
          });

          // Add adaptive reuse layer
          map.current.addLayer({
            id: `${docId}-adaptive-reuse`,
            type: 'circle',
            source: docId,
            filter: ['==', ['get', 'type'], 'adaptive-reuse'],
            paint: {
              'circle-radius': 8,
              'circle-color': [
                'interpolate',
                ['linear'],
                ['get', 'reuse_potential'],
                0, '#eff3ff',
                20, '#08519c'
              ],
              'circle-opacity': 0.7
            },
            layout: {
              visibility: 'none'
            }
          });

          // Add click handlers for popups
          map.current.on('click', `${docId}-development`, (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;
            
            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <h3>${properties.name}</h3>
                <p>${properties.description}</p>
                <p>Type: ${properties.potentialType}</p>
                <p>Potential Score: ${properties.potential_score}</p>
              `)
              .addTo(map.current);
          });

          // Similar click handlers for other layers...
        }

        // Update document layers state
        setDocumentLayers(prev => ({
          ...prev,
          [docId]: {
            analysis,
            visible: true
          }
        }));

        // Set as current document
        setCurrentDocument({
          docId,
          title: analysis.title || docId,
          analysis
        });
        setShowDocumentInsights(true);

      } catch (error) {
        console.error('Error loading document data:', error);
      }
    };

    // Load initial document
    loadDocumentData('doc_first_document');  // Replace with actual document ID

  }, [map.current]);

  const toggleDocumentLayer = (docId, visible) => {
    const layerTypes = ['development', 'infrastructure', 'transit', 'amenities', 'adaptive-reuse'];
    layerTypes.forEach(type => {
      map.current.setLayoutProperty(
        `${docId}-${type}`,
        'visibility',
        visible ? 'visible' : 'none'
      );
    });

    setDocumentLayers(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        visible
      }
    }));
  };

  return (
    <>
      <MapContainer ref={mapContainer}>
        <LayerToggle
          showDevelopmentPotential={showDevelopmentPotential}
          setShowDevelopmentPotential={setShowDevelopmentPotential}
          showInfrastructureCapacity={showInfrastructureCapacity}
          setShowInfrastructureCapacity={setShowInfrastructureCapacity}
          showTransitAccess={showTransitAccess}
          setShowTransitAccess={setShowTransitAccess}
          showAmenities={showAmenities}
          setShowAmenities={setShowAmenities}
          showAdaptiveReuse={showAdaptiveReuse}
          setShowAdaptiveReuse={setShowAdaptiveReuse}
          documentLayers={documentLayers}
          toggleDocumentLayer={toggleDocumentLayer}
        />
        <Legend
          showDevelopmentPotential={showDevelopmentPotential}
          showInfrastructureCapacity={showInfrastructureCapacity}
          showTransitAccess={showTransitAccess}
          showAmenities={showAmenities}
          showAdaptiveReuse={showAdaptiveReuse}
          documentLayers={documentLayers}
        />
        <DocumentInsightPanel
          visible={showDocumentInsights}
          documentData={currentDocument}
          onClose={() => setShowDocumentInsights(false)}
        />
      </MapContainer>
    </>
  );
};

export default Map; 