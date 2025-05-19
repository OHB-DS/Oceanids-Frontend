# 🌊 Oceanids Platform
[![Azure Static Web Apps CI/CD](https://github.com/OHB-DS/Oceanids-Frontend/actions/workflows/azure-static-web-apps-black-island-0597a3903.yml/badge.svg?branch=main)](https://github.com/OHB-DS/Oceanids-Frontend/actions/workflows/azure-static-web-apps-black-island-0597a3903.yml)

The **Oceanids platform** is an Angular-based web application for data visualization and analysis in coastal and environmental monitoring. It integrates multiple components and services for a seamless user experience.

![Platform Screenshot](https://github.com/user-attachments/assets/0ca65912-af79-4e26-b065-cc785356dfb5)

**Latest video with platform functionalities:**  
[Watch here](https://lowtideline.blob.core.windows.net/data/other/animation_2025_05_13.mp4)

---

## 🚀 Setting Up and Running the App Locally

1. **Install dependencies:**
  ```bash
  npm install
  ```
  > If you encounter errors, try:
  ```bash
  npm install --force
  ```

2. **Run the development server:**
  ```bash
  ng serve
  ```
  The app will be available at [http://localhost:4200](http://localhost:4200).

---

## ⚠️ Making Changes to the Test and Production Apps

The Angular app is hosted as an Azure Static Web App and deployed via [GitHub Actions](https://github.com/OHB-DS/Oceanids-Frontend/actions).  
A workflow is triggered when changes are pushed to the `dev` or `main` branches:

- **`dev` branch → TEST app:** [Test App](https://purple-hill-044e4e503.6.azurestaticapps.net/)
- **`main` branch → PRODUCTION app:** [Production App](https://black-island-0597a3903.6.azurestaticapps.net/)

**Recommended workflow:**
1. Work on the `dev` branch locally.
2. Test changes at `http://localhost:4200`.
3. Push to `dev` to update the Test app.
4. Verify the Test app.
5. Create a Pull Request to merge `dev` into `main`.

---

## 🖥️ Backend

The backend is a FastAPI service providing endpoints for the frontend:  
[API Docs](https://gateway.oceanids-project.eu/gateway/dataapi/docs#/)

Full documentation on the endpoints is provided in the [API Endpoints](#api-endpoints) section below.

A [STAC Catalog](https://gateway.oceanids-project.eu/gateway/stac/browser/) is also available (accept certificates if prompted).

---

## 📄 Documentation

### Angular App Structure

Angular apps are modular, built from *components* and *services*.

### Table of Contents

1. [Components](#components)
  - [Map Component](#1-map-component)
  - [Line Chart Component](#2-line-chart-component)
  - [Description Snackbar Component](#3-description-snackbar-component)
2. [Services](#services)
  - [City Service](#1-city-service)
  - [Map Service](#2-map-service)
  - [Loading Service](#3-loading-service)
3. [Functionalities](#functionalities)
4. [Guidelines for Making Changes](#guidelines-for-making-changes)
  - [Adding a New Component](#1-adding-a-new-component)
  - [Adding a New Service](#2-adding-a-new-service)
  - [Modifying Existing Components or Services](#3-modifying-existing-components-or-services)
  - [Testing](#4-testing)
  - [Building for Production](#5-building-for-production)

---

### Components

Components are frontend elements, each with its own TypeScript, HTML, and CSS files.

#### 1. **Map Component**
- **Path:** `src/app/components/map/map.component.ts`
- **Description:** Interactive map with data visualization layers and tools.
- **Features:**
  - City selection and data service toggling
  - Leaflet integration for map rendering and drawing
  - Time-series data and images in a side drawer

#### 2. **Line Chart Component**
- **Path:** `src/app/components/line-chart/line-chart.component.ts`
- **Description:** Renders time-series data as line charts.
- **Features:**
  - Dynamic updates based on filters
  - Download data as CSV or JPG
  - Service descriptions

#### 3. **Description Snackbar Component**
- **Path:** `src/app/shared/components/description-snackbar/description-snackbar.component.ts`
- **Description:** Displays contextual information about data services.

---

### Services

Services are TypeScript files that handle API requests to the backend.

#### 1. **City Service**
- **Path:** `src/app/services/city.service.ts`
- **Description:** Handles API interactions for cities and their data services.
- **Key Methods:**
  - `getCities()`
  - `getServicesForCity(city: string)`
  - `getGeoJson(service: string, city: string, dataType: string)`
  - `getTimeseriesJson(city: string, service: string, dataId: string)`
  - `getTimeseriesCsv(city: string, service: string, dataId: string)`
  - `getTimeseriesImages(city: string, service: string, dataId: string)`
  - `getTimeseriesJpg(city: string, service: string, dataId: string)`
  - `postCustomGroundMotionPolygon(geoJson: any, service: string, city: string)`

#### 2. **Map Service**
- **Path:** `src/app/services/map.service.ts`
- **Description:** Utilities for map initialization and interaction.
- **Key Methods:**
  - `initMap(map: L.Map)`
  - `drawToolbar(drawnItems: L.FeatureGroup, isPolyEnabled?: boolean)`

#### 3. **Loading Service**
- **Path:** `src/app/services/loading.service.ts`
- **Description:** Manages the application's loading state.
- **Key Methods:**
  - `show()`
  - `hide()`

---

### Functionalities

- **Interactive Map:**  
  Select cities, toggle data services, draw polygons/points, view time-series data and images.

- **Data Visualization:**  
  Render time-series as line charts, download as CSV or JPG.

- **Service Descriptions:**  
  Display detailed descriptions of data services.

- **Dynamic Filtering:**  
  Update visualizations based on user-selected filters.

---

### Guidelines for Making Changes

#### 1. **Adding a New Component**
```bash
ng generate component <component-name>
```
Add the component to the appropriate module.

#### 2. **Adding a New Service**
```bash
ng generate service <service-name>
```
Register the service in the `providers` array if needed.

#### 3. **Modifying Existing Components or Services**
- Edit files in `src/app`
- Ensure functionality is preserved
- Run unit tests:
  ```bash
  ng test
  ```

#### 4. **Testing**
- Write unit tests for new features/changes.
- Use `src/app/**/*.spec.ts` for test cases.

#### 5. **Building for Production**
```bash
ng build
```
Build artifacts are stored in `dist/oceanids5`.

---

## 📚 Angular Resources

See the [Angular CLI Overview and Command Reference](https://angular.io/cli) for more details.

---

## 🛠️ API Endpoints

The API Endpoints are available as a FastAPI service at https://gateway.oceanids-project.eu/gateway/dataapi/docs#/.
- The **INFO** endpoints are used to interrogate the database and find out what data is available.
- The **GENERAL** endpoints are used to retrieve the data as GeoJSON (for spatial layers), CSV (for time-series) or JPG (for plots).
- The **GROUND MOTION** endpoints are for specific functions that are only applicable to the ground motion service, like drawing a custom polygon.
- The **FOR DEVELOPERS** endpoints are only for developers and not used by the frontend.

```
-------------------------------------------------------------------------------
API Endpoints Documentation
-------------------------------------------------------------------------------

[INFO]
GET   /info
   - General API info.
   Example: GET https://gateway.oceanids-project.eu/gateway/dataapi/info

GET   /info/sites
   - List available sites, their services, and AOI polygons.
   Example: GET https://gateway.oceanids-project.eu/gateway/dataapi/info/sites

GET   /info/services/{site}
   - List available services for a given site.
   Example: GET https://gateway.oceanids-project.eu/gateway/dataapi/info/services/Malaga

GET   /info/timeseries/{site}/{app_domain}
   - List available timeseries datasets for a site and service.
   Example: 
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/timeseries/Malaga/wave_climate
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/timeseries/Malaga/sea_level
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/timeseries/Malaga/coastal_change
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/timeseries/Malaga/ground_motion
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/timeseries/Malaga/atmospheric_data

GET   /info/geojson/{site}/{app_domain}
   - List available spatial (GeoJSON) layers for a site and service.
   Example: 
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/geojson/Malaga/wave_climate
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/geojson/Malaga/sea_level
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/geojson/Malaga/coastal_change
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/geojson/Malaga/ground_motion
    GET https://gateway.oceanids-project.eu/gateway/dataapi/info/geojson/Malaga/atmospheric_data

[GENERAL]
GET   /general/geojson/{site}/{app_domain}/{data_type}
   - Get a GeoJSON asset as JSON.
   Example: 
    GET https://gateway.oceanids-project.eu/gateway/dataapi/general/geojson/Malaga/wave_climate/wave_climate_points
    GET https://gateway.oceanids-project.eu/gateway/dataapi/general/geojson/Malaga/sea_level/sea_level_points
    GET https://gateway.oceanids-project.eu/gateway/dataapi/general/geojson/Malaga/coastal_change/coastal_change_transects
    GET https://gateway.oceanids-project.eu/gateway/dataapi/general/geojson/Malaga/ground_motion/ground_motion_polygon
    GET https://gateway.oceanids-project.eu/gateway/dataapi/general/geojson/Malaga/atmospheric_data/atmospheric_data_points

GET   /general/timeseries/{site}/{app_domain}/{data_id}
   - Get a timeseries asset as JSON.
   Example: 
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/wave_climate/Malaga_wave_climate_rcp85_daily
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/sea_level/Malaga_sea_level_CMCC-CM2-VHR4_historical_daily
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/coastal_change/Malaga_coastal_change_transect_0069
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/ground_motion/Malaga_ground_motion_polygon
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/atmospheric_data/Malaga_Puerto_atmospheric_data_air_temperature_daily_max

GET   /general/timeseries/{site}/{app_domain}/{data_id}/csv
   - Download a timeseries as CSV.
   Example:
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/wave_climate/Malaga_wave_climate_rcp85_daily/csv

GET   /general/timeseries/{site}/{app_domain}/{data_id}/jpg
   - Download a timeseries plot as JPG.
   Example:
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/wave_climate/Malaga_wave_climate_rcp85_daily/jpg

GET   /general/timeseries/{site}/{app_domain}/{data_id}/image
   - Get a timeseries plot as base64-encoded image.
   Example:
      GET https://gateway.oceanids-project.eu/gateway/dataapi/general/timeseries/Malaga/wave_climate/Malaga_wave_climate_rcp85_daily/image

[GROUND MOTION]

POST  /specific/ground_motion/custom_polygon/{site}
   - Get ground motion timeseries for a custom polygon (GeoJSON payload).
   Example: POST https://gateway.oceanids-project.eu/gateway/dataapi/specific/ground_motion/custom_polygon/Malaga
            Body: {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[-4.376678,36.727391],[-4.378052,36.718313],[-4.355392,36.715012],[-4.353333,36.72519],[-4.376678,36.727391]]]}}

GET   /specific/ground_motion/timeseries/{site}/{point_id}
   - Get ground motion timeseries for a specific point.
   Example: GET https://gateway.oceanids-project.eu/gateway/dataapi/specific/ground_motion/timeseries/Malaga/40JyLoghfv

[FOR DEVELOPERS]
POST  /developers/preprocess/{site}/{app_domain}
   - Preprocess source data for a site/app.
   Example: POST https://gateway.oceanids-project.eu/gateway/dataapi/developers/preprocess/Bretagne/wave_climate

POST  /developers/upload_collections/{app_domain}
   - Upload collections to the STAC catalog for an app.
   Example: POST https://gateway.oceanids-project.eu/gateway/dataapi/developers/upload_collections/wave_climate

DELETE /developers/delete_collections/{app_domain}
   - Delete collections from the catalog for an app.
   Example: DELETE https://gateway.oceanids-project.eu/gateway/dataapi/developers/delete_collections/wave_climate

DELETE /developers/reset_catalog
   - Delete all collections from the catalog (dangerous).
   Example: DELETE https://gateway.oceanids-project.eu/gateway/dataapi/developers/reset_catalog

-------------------------------------------------------------------------------
```