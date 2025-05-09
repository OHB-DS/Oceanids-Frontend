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
import { defaultValueForSerivces, defaultValueForTimeseries, serviceDescriptions, chartDescriptions } from 'src/app/shared/desctiptions/service-desctiptions';
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

  public map: L.Map | undefined;
  public drawnItems: L.FeatureGroup | undefined;
  citiesAreas: CityArea[] = [];
  cityForm: FormGroup;
  cityNames: string[] = [];
  cityDataServices: string[] = [];
  @ViewChild('chartDrawer') chartDrawer!: MatDrawer;
  @ViewChild('citiesPanel') citiesPanel!: MatExpansionPanel;
  @ViewChild('dataServicesPanel') dataServicesPanel!: MatExpansionPanel;
  // @ViewChild(MatAutocompleteTrigger) trigger!: MatAutocompleteTrigger;

  @Input() downloadButtonPressed!: boolean;
  activeTabs: { [key: string]: string[] } = {};

  cityServices: { [city: string]: Set<string> } = {};
  timeseries: Timeseries;
  selectedServiceDescription: string = '';
  titleTimeseries: string = '';
  private selectedPolygon: L.Layer | null = null; // track the currently selected polygon
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
          onEachFeature: (feature, layer) => {
            // store the popup for the city
            const bounds = (layer as L.Polygon).getBounds();
            const center = bounds.getCenter();
            const popup = L.popup({ closeButton: false })
              .setLatLng(center)
              .setContent(cityName)
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
          //TODO: why is this null?
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


  // private selectCity(cityName: string, layer: L.Layer, popup: L.Popup | undefined): void {
  //   // restore the previously selected polygon to its default state
  //   console.log(layer)
  //   if (this.selectedPolygon) {
  //     (this.selectedPolygon as L.Path).setStyle({ fillOpacity: 0.2, color: '#3388ff' }); // default Leaflet style
  //     this.selectedPolygon.on('mouseover', () => {
  //       (this.selectedPolygon as L.Path).setStyle({ weight: 5 });
  //     });
  //     this.selectedPolygon.on('mouseout', () => {
  //       (this.selectedPolygon as L.Path).setStyle({ weight: 3 });
  //     });
  //     this.selectedPolygon.on('click', () => {
  //       const previousCityName = (this.selectedPolygon as any).cityName;
  //       const previousPopup = this.cityPopups[previousCityName];
  //       this.selectCity(previousCityName, this.selectedPolygon!, previousPopup);
  //     });
  //   }

  //   // update the selected polygon
  //   this.selectedPolygon = layer;

  //   // remove the click, mouseover, and mouseout event listeners
  //   layer.off('click');
  //   layer.off('mouseover');
  //   layer.off('mouseout');

  //   // reattach the click, mouseover, and mouseout event listeners to the current polygon
  //   layer.on('click', () => {
  //     this.selectCity(cityName, layer, popup);
  //   });
  //   layer.on('mouseover', () => {
  //     (layer as L.Path).setStyle({ weight: 5 });
  //   });
  //   layer.on('mouseout', () => {
  //     (layer as L.Path).setStyle({ weight: 3 });
  //   });

  //   // set the style to make it transparent so other layers are visible inside
  //   (layer as L.Path).setStyle({ fillOpacity: 0, color: 'yellow' });

  //   // fly to the selected city's bounds
  //   const bounds = (layer as L.Polygon).getBounds();
  //   const center = bounds.getCenter();
  //   const zoom = this.map!.getBoundsZoom(bounds) - 1; // calculate the appropriate zoom level for the bounds
  //   this.map!.flyTo(center, zoom); // fly to the center with the calculated zoom level

  //   // fetch and display data services for the selected city
  //   this.cityDataServices = [];
  //   this.fetchAvailableServices(cityName).subscribe(() => {
  //     this.onCityChange();
  //   });

  //   // explicitly update the cityForm value to ensure valueChanges is triggered
  //   if (this.cityForm.get('city')?.value !== cityName) {
  //     this.cityForm.get('city')?.patchValue(cityName);
  //   }
  // }
  private lastSelectedLayer: L.Layer | null = null;

  private selectCity(cityName: string, layer: L.Layer, popup: L.Popup | undefined): void {
    console.log('select')
    if (this.lastSelectedLayer && this.lastSelectedLayer !== layer) {
      (this.lastSelectedLayer as L.Path).setStyle({
        fillOpacity: 0.2,
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


  downloadTimeseriesCsv() {
    const city = this.timeseries.name;
    const service = this.timeseries.service;
    const dataId = this.timeseries.transectId;
    this.cityService.getTimeseriesCsv(city, service, dataId).subscribe(res => {
      saveAs(res, `${dataId}.csv`);
    });
  }
  downloadTimeseriesJpg() {
    const city = this.timeseries.name;
    const service = this.timeseries.service;
    const dataId = this.timeseries.transectId;
    this.cityService.getTimeseriesJpg(city, service, dataId).subscribe(res => {
      saveAs(res, `${dataId}.jpg`);
    });
  }
  get serviceFormArray() {
    return this.cityForm.get('service') as FormArray;
  }
  fetchAvailableServices(cityName: string) {
    return this.cityService.getServicesForCity(cityName).pipe(
      tap(data => {
        //@ts-ignore
        this.cityDataServices = data?.apps_available || [];
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
    const serviceLayer = layers.filter(x => x.options.serviceName === services && x.options.cityName === city);

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
            // else if (service === 'atmospheric_data') {
            //   return forkJoin({
            //     geoJsonData: of(geoJsonData),
            //     services: this.cityService.getActiveServicesForCity(this.cityForm.get('city')?.value, service)
            //   })
            // }
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
              setTimeout(() => {
                const polygonButton = document.querySelector('.leaflet-draw-draw-polygon') as HTMLElement;
                const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;

                if (polygonButton && mapContainer) {
                  const hint = document.createElement('div');
                  hint.className = 'custom-tooltip-polygon';
                  hint.innerText = 'Draw a new polygon to show ground motion displacements elsewhere';

                  mapContainer.appendChild(hint);

                  const rect = polygonButton.getBoundingClientRect();
                  const mapRect = mapContainer.getBoundingClientRect();

                  hint.style.position = 'absolute';
                  hint.style.top = `${rect.top - mapRect.top - 25}px`;
                  hint.style.left = `${rect.left - mapRect.left - 250}px`;

                  setTimeout(() => {
                    hint.remove();
                  }, 2500);
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
            default:
              break;
          }

        });
        // if checkbox is unchecked
      } else {
        const index = serviceArray.controls.findIndex(x => x.value.name === service);
        if (index !== -1) {
          serviceArray.at(index).patchValue({ selected: false });
          this.cityServices[city].delete(service);
          if (service === 'coastal_change') {
            this.hideColorBar();
          }
          if (service === 'ground_motion') {
            this.mapService.removeDrawToolbar();
            this.hideColorBar();
          }
        }
        this.selectedServiceDescription = '';
        const layersToRemove = this.findLayerByServicesAndName(this.cityForm.get('city')?.value, service);
        layersToRemove.forEach(layer => {
          this.drawnItems!.removeLayer(layer);
        });
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
    statistic: ''
  };
  onFilterChange(updatedFilters: any) {
    this.selectedFilters = { ...this.selectedFilters, ...updatedFilters };
    let dataId = '';
    switch (this.selectedFilters.service) {
      case 'sea_level':
        // sea level has multiple models (CMCC-CM2-VHR4 and EC-Earth3P-HR), so needs model keyword
        dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.model + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
        break;
      case 'wave_climate':
        // wave climate has only one model, so no model keyword
        dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.timeRange + '_' + this.selectedFilters.frequency;
        break;
      case 'atmospheric_data':
        // atmospheric data has multiple variables and multiple statistics per variable
        dataId = this.selectedFilters.site + '_' + this.selectedFilters.service + '_' + this.selectedFilters.variable + '_' + this.selectedFilters.statistic;
        break;
      default:
        dataId = '';
        break;
    }
    this.fetchImages(this.selectedFilters.city, this.selectedFilters.service, dataId);
    // uncomment to switch between images and timeseries
    // if (this.selectedFilters.frequency === 'monthly') {
    //   // this.fetchTimeseries(this.selectedFilters.city, this.selectedFilters.service, dataId);
    // } else {
    //   this.fetchImages(this.selectedFilters.city, this.selectedFilters.service, dataId);
    // }
    // update timeseries object as it is used in download button
    this.timeseries = {
      transectId: dataId,
      service: this.selectedFilters.service,
      name: this.selectedFilters.city,
      series: []
    };
  }
  // uses in code
  private handleLayerClick(city: string, service: string, layer: L.Path, geomId: string) {
    layer.unbindTooltip();
    let dataId = '';
    this.titleTimeseries = service;
    this.selectedServiceDescription = chartDescriptions[service] || 'No description available.';
    switch (service) {
      case 'coastal_change':
        dataId = geomId;
        this.fetchImages(city, service, dataId);

        break;
      case 'ground_motion':
        dataId = geomId;
        this.fetchImages(city, service, dataId);

        break;
      case 'wave_climate':
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
        //@ts-ignore
        this.cityService.getActiveServicesForCity(layer.feature.properties.site, service).subscribe((result: any) => {
          this.activeTabs = result;
          console.log(this.activeTabs)
          this.selectedFilters.city = city;
          this.selectedFilters.service = service;
          //@ts-ignore
          this.selectedFilters.site = layer.feature.properties.site;
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

        })
        break;
      default:
        break;
    }
    // populate this.timeseries for later use in the download button
    this.timeseries = {
      transectId: dataId,
      service: service,
      name: city,
      series: [] // Optionally populate this with actual data if available
    };
    //this.fetchImages(city, service, dataId);
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
}

