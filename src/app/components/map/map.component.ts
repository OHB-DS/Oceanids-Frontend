import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from 'src/app/services/map.service';
import { CityService } from 'src/app/services/city.service';
import 'leaflet-draw'
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CityArea } from 'src/app/shared/models/CityArea';
import { MatDrawer } from '@angular/material/sidenav';
import { MatExpansionPanel } from '@angular/material/expansion';
import { Series, Timeseries } from 'src/app/shared/models/Timeseries';
import { GeojsonLayerService } from 'src/app/services/geojson-layer.service';
import { concatMap, forkJoin, map, Observable, of, startWith, switchMap, tap } from 'rxjs';
import { defaultValueForSerivces, defaultValueForTimeseries, serviceDescriptions, chartDescriptions } from 'src/app/shared/descriptions/service-desctiptions';
import { saveAs } from 'file-saver';
import { chartFilter } from 'src/app/shared/models/ChartFilter';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { DescriptionSnackbarComponent } from 'src/app/shared/components/description-snackbar/description-snackbar.component';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly tidalFlatsYears = [2020, 2021, 2022, 2023, 2024, 2025];
  private readonly tidalFlatsYearColours = ['#d7191c', '#fdae61', '#32CD32', '#0074FF', '#BF00FF', '#000000'];

  public map: L.Map | undefined;
  public drawnItems: L.FeatureGroup | undefined;
  citiesAreas: CityArea[] = [];
  cityForm: FormGroup;
  cityNames: string[] = [];
  cityDataServices: string[] = [];
  tidalFlatsVectorYears: number[] = [...this.tidalFlatsYears].reverse();
  tidalFlatsRasterYear = 2025;
  tidalFlatsRasterVisible = true;
  tidalFlatsNauticalMode = false;
  tidalFlatsVectorVisibility: Record<number, boolean> = this.tidalFlatsYears.reduce((state, year) => ({
    ...state,
    [year]: year === this.tidalFlatsRasterYear,
  }), {} as Record<number, boolean>);
  @ViewChild('chartDrawer') chartDrawer!: MatDrawer;
  @ViewChild('citiesPanel') citiesPanel!: MatExpansionPanel;
  @ViewChild('dataServicesPanel') dataServicesPanel!: MatExpansionPanel;
  @Input() downloadButtonPressed!: boolean;
  activeTabs: { [key: string]: string[] } = {};
  cityServices: { [city: string]: Set<string> } = {};
  timeseries: Timeseries;
  selectedServiceDescription: string = '';
  titleTimeseries: string = '';
  showFloodLayerMenu = false;
  private selectedPolygon: L.Layer | null = null; // track the currently selected polygon
  private lastSelectedLayer: L.Layer | null = null;
  private cityPopups: { [cityName: string]: L.Popup } = {};

  constructor(
    private mapService: MapService,
    private cityService: CityService,
    private geoJsonService: GeojsonLayerService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.drawnItems = new L.FeatureGroup();
    this.cityForm = this.fb.group({
      city: ['', Validators.required],
      service: this.fb.array([], Validators.required)
    });
    this.timeseries = { transectId: '', service: '', name: '', series: [] };
  } 

  ngOnDestroy(): void {
    if (this.drawnItems && this.map) {
      this.geoJsonService.removeTidalFlatsLayer(this.drawnItems, this.map);
    }
    this.map?.off();
    this.map?.remove();
    this.map = undefined;
  }
  ngAfterViewInit(): void {
    if (this.map) {
      this.map!.addLayer(this.drawnItems!);
      this.map!.invalidateSize();
    }
  }
  ngOnInit(): void {
    // initialise map
    this.map = this.mapService.initMap(this.map!)!;

    // retrieve city areas from the backend
    this.cityService.getCities().subscribe(data => {
      const citiesLayer = L.layerGroup();
      //@ts-ignore
      const cityNames = data.sites;

      cityNames.forEach((cityName: string) => {
        //@ts-ignore
        const cityAOI = data.AOIs[cityName];
        this.cityNames.push(cityName);
        const geoJsonLayer = L.geoJSON(cityAOI, {
          style: () => ({
            fillOpacity: this.getCityFillOpacity(cityName),
            weight: 3,
          }),
          onEachFeature: (feature, layer) => {

            // store the popup for the city
            const bounds = (layer as L.Polygon).getBounds();
            const center = bounds.getCenter();
            const popup = L.popup({ closeButton: false})
              .setLatLng(center)
              .setContent(`<div class="responsive-font">${cityName}</div>`)
              .addTo(this.map!);
            this.cityPopups[cityName] = popup;

            // select city when clicked
            layer.on('click', () => {
              this.selectCity(cityName, layer, popup);
            });

            // highlight the polygon on mouseover and mouseout
            layer.on('mouseover', function () {
              (layer as L.Path).setStyle({ weight: 5 });
            });
            layer.on('mouseout', function () {
              (layer as L.Path).setStyle({ weight: 3 });
            });
          },
        });
        //@ts-ignore
        geoJsonLayer.cityName = cityName;
        citiesLayer.addLayer(geoJsonLayer);
      });
      //@ts-ignore
      citiesLayer.options.type = 'citiesArea';
      citiesLayer.addTo(this.drawnItems!);
    });

    // listen for changes in the city selection
    this.cityForm.get('city')?.valueChanges.subscribe(cityName => {
      const layer = this.findLayerGroupByName('cityName', cityName);
      if (layer) {
        const popup = this.cityPopups[cityName];
        this.selectCity(cityName, layer, popup);
      }
    });

    // listen for changes in the service selection
    this.cityForm.get('city')?.valueChanges.pipe(
      concatMap(city => {
        this.cityDataServices = []
        return forkJoin([
          //todo: why is this null?
          of(null),
          this.fetchAvailableServices(city)
        ]);
      })

    ).subscribe(() => {
      this.onCityChange();
    });

    // listen for when a new polygon is drawn (only for ground motion)
    this.map!.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      const service = 'ground_motion';
      const geoJSONGroundMotion = layer.toGeoJSON();
      // first remove existing polygons and points
      const layersToRemove = this.findLayerByServicesAndName(this.cityForm.get('city')?.value, service);
      layersToRemove.forEach(layer => {
        this.drawnItems!.removeLayer(layer);
      });
      // then load new custom polygon and points
      this.processCustomGroundMotionPolygon(geoJSONGroundMotion, service, this.cityForm.get("city")?.value);
    });
  }

  private selectCity(cityName: string, layer: L.Layer, popup: L.Popup | undefined): void {
    if (this.lastSelectedLayer && this.lastSelectedLayer !== layer) {
      (this.lastSelectedLayer as L.Path).setStyle({
        fillOpacity: this.getCityFillOpacity((this.lastSelectedLayer as any).cityName),
        color: '#3388ff',
        weight: 3
      });
      this.lastSelectedLayer.off('mouseover');
      this.lastSelectedLayer.off('mouseout');
      this.lastSelectedLayer.on('mouseover', () => {
        (this.lastSelectedLayer as L.Path).setStyle({ weight: 5 });
      });
      this.lastSelectedLayer.on('mouseout', () => {
        (this.lastSelectedLayer as L.Path).setStyle({ weight: 3 });
      });
    }
    this.lastSelectedLayer = layer;
    layer.off();
    (layer as L.Path).setStyle({
      fillOpacity: 0,
      color: 'yellow',
      weight: 3
    });
    layer.on('mouseover', () => {
      (layer as L.Path).setStyle({ weight: 5 });
    });
    layer.on('mouseout', () => {
      (layer as L.Path).setStyle({ weight: 3 });
    });
    layer.on('click', () => {
      if (this.cityForm.get('city')?.value !== cityName) {
        this.selectCity(cityName, layer, popup);
      }
    });
    const bounds = (layer as L.Polygon).getBounds();
    const center = bounds.getCenter();
    const zoom = this.map!.getBoundsZoom(bounds) - 1;
    this.map!.flyTo(center, zoom);
    this.cityDataServices = [];
    this.fetchAvailableServices(cityName).subscribe(() => {
      this.onCityChange();
    });
    if (this.cityForm.get('city')?.value !== cityName) {
      this.cityForm.get('city')?.patchValue(cityName);
    }
  }

  private getCityFillOpacity(cityName: string | undefined): number {
    return cityName === 'Crete' ? 0 : 0.2;
  }

  downloadCsv() {
    const city = this.timeseries.name;
    const service = this.timeseries.service;
    const dataId = this.timeseries.transectId;
    console.log('downloadCsv', dataId);
    this.cityService.getTimeseriesCsv(city, service, dataId).subscribe(res => {
      saveAs(res, `${dataId}.csv`);
    });
  }

  downloadJpg() {
    console.log('downloadJPG', this.selectedFilters);
    if (this.selectedFilters.service === 'coastal_flooding') {
      this.cityService.getFloodmapDownload(this.selectedFilters.site, this.selectedFilters.returnPeriod, this.selectedFilters.climateScenario, this.selectedFilters.timeRange, 'jpg').subscribe(res => {
        saveAs(res, `${this.selectedFilters.site}_${this.selectedFilters.service}_${this.selectedFilters.returnPeriod}_${this.selectedFilters.climateScenario}_${this.selectedFilters.timeRange}.jpg`);
      });
    } else {
      const city = this.timeseries.name;
      const service = this.timeseries.service;
      const dataId = this.timeseries.transectId;
      this.cityService.getTimeseriesJpg(city, service, dataId).subscribe(res => {
        saveAs(res, `${dataId}.jpg`);
      });
    }
  }

  downloadTif() {
    console.log('downloadTif', this.selectedFilters);
    if (this.selectedFilters.service === 'coastal_flooding') {
      this.cityService.getFloodmapDownload(this.selectedFilters.site, this.selectedFilters.returnPeriod, this.selectedFilters.climateScenario, this.selectedFilters.timeRange, 'tif').subscribe(res => {
        saveAs(res, `${this.selectedFilters.site}_${this.selectedFilters.service}_${this.selectedFilters.returnPeriod}_${this.selectedFilters.climateScenario}_${this.selectedFilters.timeRange}.tif`);
      });
      return;
    }

    this.cityService.getTidalFlatsDownload(this.tidalFlatsRasterYear, 'tif', this.tidalFlatsNauticalMode).subscribe(res => {
      const rasterMode = this.tidalFlatsNauticalMode ? 'nautical' : 'ndwi';
      saveAs(res, `Wadden_Sea_tidal_flats_${rasterMode}_${this.tidalFlatsRasterYear}.tif`);
    });
  }

  showOnMap() {
    console.log('showOnMap', this.selectedFilters);
    this.showFloodLayerMenu = this.selectedFilters.service === 'coastal_flooding';
    this.chartDrawer.close();
    this.fetchFloodMapTitiler(this.selectedFilters.site, this.selectedFilters.returnPeriod, this.selectedFilters.climateScenario, this.selectedFilters.timeRange);
  }

  updateFloodLayerFilter(filterName: 'returnPeriod' | 'climateScenario' | 'timeRange', value: string): void {
    this.selectedFilters = {
      ...this.selectedFilters,
      [filterName]: value,
    };
    if (this.showFloodLayerMenu && this.selectedFilters.service === 'coastal_flooding') {
      this.chartDrawer.close();
      this.fetchFloodMapTitiler(
        this.selectedFilters.site,
        this.selectedFilters.returnPeriod,
        this.selectedFilters.climateScenario,
        this.selectedFilters.timeRange
      );
    }
  }

  hideFloodLayerMenu(): void {
    this.showFloodLayerMenu = false;
  }

  get serviceFormArray() {
    return this.cityForm.get('service') as FormArray;
  }

  fetchAvailableServices(cityName: string) {
    return this.cityService.getServicesForCity(cityName).pipe(
      tap(data => {
        //@ts-ignore
        this.cityDataServices = data?.services_available || [];
      })
    );
  }

  findLayerGroupByName(prop: string, name: string) {
    const layers = this.drawnItems!.getLayers()
    //@ts-ignore
    const cityAreaLayer = layers.find(x => x.options.type === 'citiesArea');
    if (cityAreaLayer && this.map) {
      //@ts-ignore
      for (let layerId in cityAreaLayer._layers) {
        //@ts-ignore
        const polygonLayer = cityAreaLayer._layers[layerId]
        if (polygonLayer[prop] === name) {
          return polygonLayer;
        }
      }

    }
  }

  findLayerByServicesAndName(city: string, services: any) {
    const layers = this.drawnItems!.getLayers();
    //@ts-ignore
    const serviceLayer = layers.filter(x => x.options.serviceName === services && x.options.cityName === city)
    return serviceLayer!;

  }

  closeChartDrawer() {
    this.chartDrawer.close();
  }

  openChartDrawer() {
    this.chartDrawer.open();
  }
  
  onCityChange() {
    this.citiesPanel.close();
    this.dataServicesPanel.open();
    const city = this.cityForm.get('city')?.value;
    const serviceArray = this.cityForm.get('service') as FormArray;
    serviceArray.clear();
    if (this.cityDataServices.length > 0) {
      this.cityDataServices.forEach(service => {
        const isSelected = this.cityServices[city]?.has(service) || false;
        serviceArray.push(this.fb.group({
          name: [service],
          selected: [isSelected]
        }));
      });
    }
  }

  onCheckboxChange(event: any, service: string) {
    const serviceArray = this.cityForm.get('service') as FormArray;
    const city = this.cityForm.get('city')?.value;
    const index = this.cityDataServices.indexOf(service);
    if (!this.cityServices[city]) {
      this.cityServices[city] = new Set<string>;
    }
    if (index !== -1) {
      serviceArray.at(index).get('selected')?.setValue(event.checked);
      // if a checkbox is checked
      if (event.checked) {
        this.cityServices[city].add(service);
        if (service === 'tidal_flats') {
          this.geoJsonService.addTidalFlatsLayer(service, city, this.drawnItems!, this, this.map!, {
            rasterYear: this.tidalFlatsRasterYear,
            rasterVisible: this.tidalFlatsRasterVisible,
            nauticalMode: this.tidalFlatsNauticalMode,
            vectorVisibility: this.tidalFlatsVectorVisibility,
          });
          return;
        }
        this.cityService.getGeoJson(service, this.cityForm.get('city')?.value, defaultValueForSerivces[service]).pipe(
          switchMap((geoJsonData: any) => {
            if (service === 'coastal_change') {
              return forkJoin({
                geoJsonData: of(geoJsonData),
                baseLine: this.cityService.getGeoJson(service, this.cityForm.get('city')?.value, defaultValueForSerivces[service + '_baseline'])
              })
            }
            else if (service === 'ground_motion') {
              return forkJoin({
                geoJsonData: of(geoJsonData),
                points: this.cityService.getGeoJson(service, this.cityForm.get('city')?.value, defaultValueForSerivces[service + '_points'])
              })
            }
            return of(geoJsonData);
          })
        ).subscribe((result: any) => {
          switch (service) {

            case 'coastal_change':
              // add colorbar
              if (document.querySelector('.info.legend')) {
                this.showColorBar();
              }
              // add geojson layer with transects and baseline
              this.geoJsonService.addGeoJsonCoastChangeLayer(result.geoJsonData, result.baseLine, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              break;

            case 'ground_motion':
              // add colorbar
              if (document.querySelector('.info.legend')) {
                this.showColorBar();
              }
              // add geojson layer with polygon and points
              this.geoJsonService.addGeoJsonGroundMotionLayer(result.geoJsonData, result.points, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              // add drawing toolbox
              this.map?.addControl(this.mapService.drawToolbar(this.drawnItems!, true));
              // add pop up indicating how to draw a new polygon
              setTimeout(() => {
                const polygonButton = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
                const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
                if (polygonButton && mapContainer) {
                  const hint = document.createElement('div');
                  hint.className = 'custom-tooltip-polygon';
                  hint.innerText = 'Draw a polygon to show ground motion elsewhere';
                  mapContainer.appendChild(hint);
                  // place tooltip relative to the drawing button (a bit of calcs to get it right)
                  const rect = polygonButton.getBoundingClientRect();
                  const mapRect = mapContainer.getBoundingClientRect();
                  const relativeTop = ((rect.top - mapRect.top) - (hint.offsetHeight / 2) + (rect.height / 2)) / mapRect.height * 100;
                  const relativeLeft = (rect.left - mapRect.left) / mapRect.width * 100 - (hint.offsetWidth * 1.15 / mapRect.width * 100);
                  hint.style.position = 'absolute';
                  hint.style.top =  `${relativeTop}%`;
                  hint.style.left = `${relativeLeft}%`;
                  setTimeout(() => {
                    hint.remove();
                  }, 30000); // remove hint after 60 seconds
                }
              }, 100);
              break;

            case 'wave_climate':
              // add points
              this.geoJsonService.addGeoJsonWavesOrSeaLevelorAtmosphericLayer(result, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              break;

            case 'sea_level':
              // add points
              this.geoJsonService.addGeoJsonWavesOrSeaLevelorAtmosphericLayer(result, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              break;

            case 'atmospheric_data':
              // add points
              this.geoJsonService.addGeoJsonWavesOrSeaLevelorAtmosphericLayer(result, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              break;

            case 'coastal_flooding':
              // add colorbar
              if (document.querySelector('.info.legend')) {
                this.showColorBar();
              }
              // add flood map layer
              this.geoJsonService.addFloodmapLayer(result, service, this.cityForm.get('city')?.value, this.drawnItems!, this, this.map!);
              break;

            default:
              break;
          }

        });
      // if checkbox is unchecked
      } else {
        if (service === 'tidal_flats') {
          serviceArray.at(index).patchValue({ selected: false });
          this.cityServices[city].delete(service);
          this.selectedServiceDescription = '';
          if (this.drawnItems && this.map) {
            this.geoJsonService.removeTidalFlatsLayer(this.drawnItems, this.map);
          }
          this.showFloodLayerMenu = false;
          return;
        }

        const selectedIndex = serviceArray.controls.findIndex(x => x.value.name === service);
        if (selectedIndex !== -1) {
          serviceArray.at(selectedIndex).patchValue({ selected: false });
          this.cityServices[city].delete(service);
          // remove colorbar legends for coastal change, ground motion and flooding
          if (service === 'coastal_change' || service === 'coastal_flooding') {
            this.hideColorBar();
          }
          // for ground motion also removing the Drawing tooltip
          else if (service === 'ground_motion') {
            this.mapService.removeDrawToolbar();
            this.hideColorBar();
            const tooltip = document.querySelector('.custom-tooltip-polygon');
            if (tooltip) {
              tooltip.remove();
            }
          }
        }
        // remove existing geojson layers
        this.selectedServiceDescription = '';
        const layersToRemove = this.findLayerByServicesAndName(this.cityForm.get('city')?.value, service);
        layersToRemove.forEach(layer => {
          this.drawnItems!.removeLayer(layer);
        });
        // remove floodmap layer if it exists
        if (service === 'coastal_flooding') {
          this.showFloodLayerMenu = false;
          if (this.map) {
            this.map.eachLayer((layer: any) => {
              if (layer.options && layer.options.layerName === 'floodmap') {
                this.map!.removeLayer(layer);
              }
            });
          }
        }
      }
    }
  }

  showInfo(service: any): void {
    const description = serviceDescriptions[service];
    this.snackBar.openFromComponent(DescriptionSnackbarComponent, {
      data: description,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['info-snackbar']
    })
  }

  private hideColorBar() {
    const colorBarElement = document.querySelector('.info.legend') as HTMLElement;
    if (colorBarElement) {
      colorBarElement.style.display = 'none';
    }
  }

  private showColorBar() {
    const colorBarElement = document.querySelector('.info.legend') as HTMLElement;
    if (colorBarElement) {
      colorBarElement.style.display = 'block';
    }
  }

  selectedFilters: chartFilter = {
    city: '',
    service: '',
    site: '',
    frequency: '',
    timeRange: '',
    model: '',
    variable: '',
    statistic: '',
    returnPeriod: '',
    climateScenario: '',
    availableTabs: {},
  };

  onFilterChange(updatedFilters: any) {
    this.selectedFilters = { ...this.selectedFilters, ...updatedFilters };
    let dataId = '';
    if (this.selectedFilters.service == 'coastal_flooding') {
      dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.returnPeriod + '_' + this.selectedFilters.climateScenario + '_' + this.selectedFilters.timeRange;
      this.fetchFloodMap(this.selectedFilters.site, this.selectedFilters.returnPeriod, this.selectedFilters.climateScenario, this.selectedFilters.timeRange);
    } else {
      switch (this.selectedFilters.service) {
        case 'sea_level':
          // sea level has multiple models (CMCC-CM2-VHR4 and EC-Earth3P-HR), so needs model keyword
          if (this.selectedFilters.frequency === 'extremes') {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.model + '_' + this.selectedFilters.frequency;
          } else {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.model + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
          }
          break;
        case 'wave_climate':
          // wave climate has only one model, so no model keyword
          if (this.selectedFilters.frequency === 'extremes') {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.frequency;
          } else {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
          }
          break;
        case 'atmospheric_data':
          // atmospheric data has multiple variables and multiple statistics per variable
          if (this.selectedFilters.timeRange === 'seasonal') {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.variable + '_' + this.selectedFilters.statistic;
          } else {
            dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.variable + '_' + this.selectedFilters.statistic;
          }
          break;      
        default:
          dataId = '';
          break;
      }
      this.fetchImages(this.selectedFilters.city, this.selectedFilters.service, dataId);
    }

    // update timeseries object as it is used in download button
    this.timeseries = {
      transectId: dataId,
      service: this.selectedFilters.service,
      name: this.selectedFilters.city,
      series: []
    };
  }

  private handleLayerClick(city: string, service: string, layer: L.Path | null, geomId: string) {
    // layer.unbindTooltip();
    let dataId = '';
    this.titleTimeseries = service;
    this.selectedServiceDescription = chartDescriptions[service] || 'No description available.';
    switch (service) {

      case 'coastal_change':
        this.showFloodLayerMenu = false;
        dataId = geomId;
        this.fetchImages(city, service, dataId);
        break;

      case 'ground_motion':
        this.showFloodLayerMenu = false;
        dataId = geomId;
        this.fetchImages(city, service, dataId);
        break;

      case 'wave_climate':
        this.showFloodLayerMenu = false;
        this.selectedFilters.city = city;
        this.selectedFilters.service = service;
        //@ts-ignore
        this.selectedFilters.site = layer.feature.properties.site;
        this.selectedFilters.timeRange = 'historical';
        this.selectedFilters.frequency = 'hourly';
        dataId = this.selectedFilters.site + '_' + service + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
        this.fetchImages(city, service, dataId);
        break;

      case 'sea_level':
        this.showFloodLayerMenu = false;
        this.selectedFilters.city = city;
        this.selectedFilters.service = service;
        //@ts-ignore
        this.selectedFilters.site = layer.feature.properties.site;
        this.selectedFilters.model = 'CMCC-CM2-VHR4';
        this.selectedFilters.timeRange = 'historical';
        this.selectedFilters.frequency = 'hourly';
        dataId = this.selectedFilters.site + '_' + service + '_' + this.selectedFilters.model + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
        this.fetchImages(city, service, dataId);
        break;

      case 'atmospheric_data':
        this.showFloodLayerMenu = false;
        //@ts-ignore
        this.cityService.getActiveServicesForCity(layer.feature.properties.site, service).subscribe((result: any) => {
          this.selectedFilters.city = city;
          this.selectedFilters.service = service;
          this.selectedFilters.timeRange = 'seasonal';
          //@ts-ignore
          this.selectedFilters.site = layer.feature.properties.site;
          this.selectedFilters.availableTabs = result;
          // split into seasonal and projection
          this.activeTabs = result[this.selectedFilters.timeRange];
          const availableVariables = Object.keys(this.activeTabs);
          if (availableVariables.length > 0) {
            const firstVariable = availableVariables[0];
            const stats = this.activeTabs[firstVariable];
            if (stats && stats.length > 0) {
              this.selectedFilters.variable = firstVariable;
              this.selectedFilters.statistic = stats[0];
            }
          }
          dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.variable + '_' + this.selectedFilters.statistic;
          this.fetchImages(city, service, dataId);
          // update timeseries object asynchronosly as is it used in download button
          this.timeseries = {
            transectId: dataId,
            service: service,
            name: city,
            series: [] // Optionally populate this with actual data if available
          };
        });
        break;
        
      case 'coastal_flooding':
        this.selectedServiceDescription = chartDescriptions[service] || 'No description available.';
        this.titleTimeseries = service;
        this.showFloodLayerMenu = true;
        this.selectedFilters.site = city;
        this.selectedFilters.city = city;
        this.selectedFilters.service = service;
        //@ts-ignore
        this.selectedFilters.timeRange = '2100';
        this.selectedFilters.returnPeriod = '100';
        this.selectedFilters.climateScenario = 'SSP245';
        this.chartDrawer.close();
        this.fetchFloodMapTitiler(this.selectedFilters.site, this.selectedFilters.returnPeriod, this.selectedFilters.climateScenario, this.selectedFilters.timeRange);
        break

      case 'tidal_flats':
        this.selectedFilters.city = city;
        this.selectedFilters.site = city;
        this.selectedFilters.service = service;
        this.showFloodLayerMenu = true;
        this.chartDrawer.close();
        break;

      default:
        break;
    }
    this.timeseries = {
      transectId: dataId,
      service: service,
      name: city,
      series: [] // Optionally populate this with actual data if available
    };
  }

  private fetchTimeseries(city: string, service: string, dataId: string) {
    this.cityService.getTimeseriesJson(city, service, dataId)
      .subscribe((timeseries: any) => {
        this.chartDrawer.open();
        this.timeseries = {
          transectId: dataId,
          service: service,
          name: city,
          series: timeseries.data as Series[]
        };
      });
  }

  chartImage = ''
  fetchImages(city: string, service: string, dataId: string) {
    this.cityService.getTimeseriesImages(city, service, dataId).subscribe((image: any) => {
      this.chartDrawer.open();
      this.chartImage = "data:image/png;base64," + image;
    })
  }
  fetchFloodMap(city: string, returnPeriod: string, scenario: string, time: string) {
    this.cityService.getFloodmapImages(city, returnPeriod, scenario, time).subscribe((image: any) => {
      this.chartDrawer.open();
      this.chartImage = "data:image/png;base64," + image;
    });
  }
  fetchFloodMapTitiler(city: string, returnPeriod: string, scenario: string, time: string) {
    // Remove any existing titilerLayer before adding a new one
    if (this.map) {
      this.map.eachLayer((layer: any) => {
        if (layer.options && layer.options.layerName === 'floodmap') {
          this.map!.removeLayer(layer);
        }
      });
    }

    this.cityService.getFloodmapXYZ(city, returnPeriod, scenario, time).subscribe((output: any) => {
      console.log('Titiler url:', output['leaflet_url']);
      const titilerLayer = L.tileLayer(output['leaflet_url'],
        {
          tileSize: 256,
          minZoom: 8,
          maxZoom: 22,
          opacity: 0.7,
          bounds: output['leaflet_bounds'],
          attribution: 'TiTiler'
        }
      );
      //@ts-ignore
      titilerLayer.options.layerName = 'floodmap';
      titilerLayer.addTo(this.map!);
      titilerLayer.bringToFront();
      this.chartDrawer.close();
    });
  }

  private processCustomGroundMotionPolygon(geoJson: any, service: string, city: string) {
    this.cityService.postCustomGroundMotionPolygon(geoJson, service, city).pipe(
      switchMap(() => {
        // Wait for the server to process the custom polygon and then fetch the layers
        return forkJoin([
          this.cityService.getGeoJson(service, city, 'ground_motion_custom_polygon'),
          this.cityService.getGeoJson(service, city, 'ground_motion_custom_points')
        ]);
      })
    ).subscribe(([polygonData, pointData]: [any, any]) => {
      // Add the custom polygon layer to the map
      this.geoJsonService.addGeoJsonGroundMotionPolygonLayer(polygonData, service, city, this.drawnItems!, this, this.map!);

      // Add the custom points layer to the map
      this.geoJsonService.addGeoJsonGroundMotionPointLayer(pointData, service, city, this.drawnItems!, this, this.map!);
    });
  }

  private fetchTimeSeriesGroundMotion(city: string, service: string, pointId: string) {
    this.cityService.getTimeseriesForGroundMotionPoint(service, city, pointId).subscribe((timeseries: any) => {
      this.chartDrawer.open();
      this.timeseries = {
        transectId: pointId,
        service: service,
        name: city,
        series: timeseries.data as Series[]
      };
    });
  }

  getTidalFlatsVectorColour(year: number): string {
    const yearIndex = this.tidalFlatsYears.indexOf(year);
    return this.tidalFlatsYearColours[yearIndex] || '#000000';
  }

  toggleTidalFlatsVectorYear(year: number, checked: boolean): void {
    this.tidalFlatsVectorVisibility[year] = checked;
    this.geoJsonService.updateTidalFlatsVectorLayers(this.tidalFlatsVectorVisibility);
  }

  showAllTidalFlatsVectorYears(): void {
    this.tidalFlatsYears.forEach(year => {
      this.tidalFlatsVectorVisibility[year] = true;
    });
    this.geoJsonService.updateTidalFlatsVectorLayers(this.tidalFlatsVectorVisibility);
  }

  hideAllTidalFlatsVectorYears(): void {
    this.tidalFlatsYears.forEach(year => {
      this.tidalFlatsVectorVisibility[year] = false;
    });
    this.geoJsonService.updateTidalFlatsVectorLayers(this.tidalFlatsVectorVisibility);
  }

  moveTidalFlatsRasterYear(direction: -1 | 1): void {
    const yearIndex = this.tidalFlatsYears.indexOf(this.tidalFlatsRasterYear);
    const nextIndex = (yearIndex + direction + this.tidalFlatsYears.length) % this.tidalFlatsYears.length;
    this.tidalFlatsRasterYear = this.tidalFlatsYears[nextIndex];
    this.geoJsonService.updateTidalFlatsRasterLayer(this.tidalFlatsRasterYear, this.tidalFlatsNauticalMode, this.tidalFlatsRasterVisible);
  }

  toggleTidalFlatsNauticalMode(checked: boolean): void {
    this.tidalFlatsNauticalMode = checked;
    this.geoJsonService.updateTidalFlatsRasterLayer(this.tidalFlatsRasterYear, this.tidalFlatsNauticalMode, this.tidalFlatsRasterVisible);
  }

  toggleTidalFlatsRasterVisibility(checked: boolean): void {
    this.tidalFlatsRasterVisible = checked;
    this.geoJsonService.updateTidalFlatsRasterLayer(this.tidalFlatsRasterYear, this.tidalFlatsNauticalMode, this.tidalFlatsRasterVisible);
  }

  private activateTidalFlatsService(city: string): void {
    this.titleTimeseries = 'tidal_flats';
    this.selectedServiceDescription = chartDescriptions['tidal_flats'] || 'No description available.';
    this.selectedFilters.city = city;
    this.selectedFilters.site = city;
    this.selectedFilters.service = 'tidal_flats';
    this.showFloodLayerMenu = true;
    this.chartDrawer.close();
    if (this.drawnItems && this.map) {
      this.geoJsonService.addTidalFlatsLayer('tidal_flats', city, this.drawnItems, this, this.map, {
        rasterYear: this.tidalFlatsRasterYear,
        rasterVisible: this.tidalFlatsRasterVisible,
        nauticalMode: this.tidalFlatsNauticalMode,
        vectorVisibility: this.tidalFlatsVectorVisibility,
      });
    }
  }
}

