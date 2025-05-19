import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Timeseries } from '../shared/models/Timeseries';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CityService {
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
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/image`, { responseType: 'text' })
  }
  getTimeseriesCsv(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/csv`, {
      responseType: 'blob'
    })
  }
  getTimeseriesJpg(city: string, service: string, dataId: string) {
    return this.http.get(`${environment.apiUrl}/general/timeseries/${city}/${service}/${dataId}/jpg`, {
      responseType: 'blob'
    })
  }
  getTimeseriesForGroundMotionPoint(service: string, city: string, pointId: string) {
    return this.http.get(`${environment.apiUrl}/specific/${service}/timeseries/${city}/${pointId}`);
  }
  postCustomGroundMotionPolygon(geoJson: any, service: string, city: string) {
    console.log(geoJson);
    return this.http.post(
      `${environment.apiUrl}/specific/${service}/custom_polygon/${city}`,
      geoJson
    );
  }
}
