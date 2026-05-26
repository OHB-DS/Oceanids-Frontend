import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Timeseries } from '../shared/models/Timeseries';
import { environment } from 'src/environments/environment';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private readonly tidalFlatsMainUrl = 'https://minio.dive.edito.eu/oidc-kvos/eotideline/';
  private readonly tidalFlatsBounds = [[51.174363049097344, 2.9996042237194898], [55.94588687876212, 9.153869368067731]];

  constructor(private http: HttpClient) { }

  getCities() {
    return this.http.get(`${environment.apiUrl}/info/sites`)
  }
  getServicesForCity(city: string) {
    return this.http.get(`${environment.apiUrl}/info/services/${city}`)
  }
  getActiveServicesForCity(city: string, service: string) {
    return this.http.get(`${environment.apiUrl}/specific/atmospheric_data/timeseries/${city}`)
  }
  getGeoJson(service: string, city: string, dataType: string) {
    return this.http.get(`${environment.apiUrl}/general/geojson/${city}/${service}/${dataType}`)
  }
  getTimeseriesJson(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}`)
  }
  getTimeseriesImages(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/image`,
      {responseType: 'text'})
  }
  getTimeseriesCsv(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/csv`, 
      {responseType: 'blob'})
  }
  getTimeseriesJpg(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/jpg`, 
      {responseType: 'blob'})
  }
  getTimeseriesForGroundMotionPoint(service: string, city: string, pointId: string) {
    return this.http.get(`${environment.apiUrl}/specific/${service}/timeseries/${city}/${pointId}`);
  }
  postCustomGroundMotionPolygon(geoJson: any, service: string, city: string) {
    return this.http.post(`${environment.apiUrl}/specific/${service}/custom_polygon/${city}`,geoJson);
  }
  getFloodmapImages(city: string, returnPeriod: string, scenario: string, time: string) {
    return this.http.get(`${environment.apiUrl}/specific/coastal_flooding/${city}/${returnPeriod}/${scenario}/${time}/image`, 
      {responseType: 'text'})
  }
  getFloodmapDownload(city: string, returnPeriod: string, scenario: string, time: string, data_type: string) {
    return this.http.get(`${environment.apiUrl}/specific/coastal_flooding/${city}/${returnPeriod}/${scenario}/${time}/${data_type}/download`, 
      {responseType: 'blob'})
  }
  getFloodmapXYZ(city: string, returnPeriod: string, scenario: string, time: string) {
    return this.http.get(`${environment.apiUrl}/specific/coastal_flooding/${city}/${returnPeriod}/${scenario}/${time}/xyz`)}

  getTidalFlatsFlatGeobufUrl(year: number) {
    return `${this.tidalFlatsMainUrl}4_flatgeobuf/${year}_Wadden_Sea_lowtideline_v5.fgb`;
  }

  getTidalFlatsXYZ(year: number, nauticalMode: boolean) {
    const tifName = nauticalMode
      ? `EOTideLines_single_cog_nautical_${year}.tif`
      : `EOTideLines_single_cog_ndwi_${year}.tif`;
    const titilerBase = 'https://gateway.oceanids-project.eu/gateway/titiler/cog/tiles/WebMercatorQuad/{z}/{x}/{y}@1x';
    const cogUrl = encodeURIComponent(`${this.tidalFlatsMainUrl}5_cogs/${tifName}`);
    const leafletUrl = nauticalMode
      ? `${titilerBase}?url=${cogUrl}&nodata=0&pixel_selection=first&colormap=%7B%221%22%3A+%22%2333aaee%22%2C+%222%22%3A+%22%2373c673%22%2C+%223%22%3A+%22%23ffee77%22%7D`
      : `${titilerBase}?url=${cogUrl}&nodata=65535&pixel_selection=first&colormap_name=coolwarm&rescale=11468.625%2C40959.375`;

    return of({
      leaflet_url: leafletUrl,
      leaflet_bounds: this.tidalFlatsBounds,
    });
  }

  getTidalFlatsDownload(year: number, dataType: 'geojson' | 'tif', nauticalMode = false) {
    if (dataType === 'geojson') {
      return this.http.get(`${this.tidalFlatsMainUrl}3_geojson/${year}_Wadden_Sea_lowtideline_v5.geojson`, { responseType: 'blob' });
    }

    const tifName = nauticalMode
      ? `EOTideLines_single_cog_nautical_${year}.tif`
      : `EOTideLines_single_cog_ndwi_${year}.tif`;
    return this.http.get(`${this.tidalFlatsMainUrl}5_cogs/${tifName}`, { responseType: 'blob' });
  }
}
