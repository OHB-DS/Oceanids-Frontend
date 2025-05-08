import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor() { }

  initMap(map: L.Map) {
    const OpenStreetMap_Mapnik = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });

    const SatelliteMap = L.tileLayer.wms('https://tiles.maps.eox.at/wms?', {
      format: 'image/png',
      transparent: false,
      layers: 's2cloudless-2020',
      maxZoom: 19,
      opacity: 1,
    });

    SatelliteMap.options.crs = L.CRS.EPSG4326;

    const GoogleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.google.com/maps">Google Maps</a>',
    });

    const EsriWorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 20,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
    });

    map = L.map('map', {
      layers: [SatelliteMap],
      center: [43.338804, 21.961847],
      zoom: 4,
      maxZoom: 18,
      zoomDelta: 0.25,
      zoomSnap: 0.25,
    });

    // Control layers
    const baseMaps = {
      'Open Street Map': OpenStreetMap_Mapnik,
      'Satellite Sentinel-2 cloud-free 2020': SatelliteMap,
      'Google Hybrid': GoogleHybrid,
      'Esri World Imagery': EsriWorldImagery, // Add Esri World Imagery to basemaps
    };

    const overlayMaps = {};

    L.control.layers(baseMaps, overlayMaps).addTo(map);
    map.zoomControl.setPosition('bottomright');

    return map;
  }

  drawToolbar(drawnItems: L.FeatureGroup, isPolyEnabled?: boolean) {
    return new L.Control.Draw({
      position: 'topright', // Change the position of the draw toolbar
      draw: {
        polyline: false,
        circle: false,
        polygon: isPolyEnabled ? {
          allowIntersection: false,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> Polygons cannot intersect!',
          },
          shapeOptions: {
            color: '#bada55',
          },
        } : false,
        circlemarker: false,
        marker: false,
        rectangle: false,
      },
      edit: {
        featureGroup: drawnItems,
        edit: false,
        remove: false
      } // Disable edit and remove toolbars
    });
  }

  removeDrawToolbar(): void {
    const drawToolbar = document.querySelector('.leaflet-draw-toolbar');
    if (drawToolbar) {
      drawToolbar.remove();
    }
  }
}

