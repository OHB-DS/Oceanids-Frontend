import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { LegendPosition } from '@swimlane/ngx-charts';
import { first } from 'rxjs';
import { yAxisLabels } from 'src/app/shared/descriptions/service-desctiptions';


@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss'
})
export class LineChartComponent implements OnInit, OnChanges, AfterViewInit {
  constructor(private cdRef: ChangeDetectorRef) {
  }
  ngAfterViewInit(): void {
    this.view = [this.chartContainer.nativeElement.offsetWidth, 400];
    this.cdRef.detectChanges();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dataServiceName']) {
      this.yAxisLabel = yAxisLabels[this.dataServiceName] || 'Values';
    }

  }
  ngOnInit(): void {
    this.yAxisLabel = yAxisLabels[this.dataServiceName] || 'Values';
  }
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @Input() multi: any[] = [];
  @Input() dataServiceName: string = '';
  @Input() description: string = '';
  @Input() activeTabs: { [key: string]: string[] } = {};
  @Input() chartImage: string = '';
  @Output() downloadCsvButtonClicked = new EventEmitter<void>();
  @Output() downloadJpgButtonClicked = new EventEmitter<void>();
  @Output() downloadTifButtonClicked = new EventEmitter<void>();
  @Input() selectedFilters: any;
  @Output() filterChange = new EventEmitter<any>();
  view: [number, number] = [0, 300];

  // options
  legend: boolean = true;
  showLabels: boolean = true;
  animations: boolean = true;
  xAxis: boolean = true;
  yAxis: boolean = true;
  showYAxisLabel: boolean = true;
  showXAxisLabel: boolean = true;
  //xAxisLabel: string = 'Time';
  yAxisLabel: string = 'Values';
  timeline: boolean = true;
  below = LegendPosition.Below

  downloadCsv() {
    this.downloadCsvButtonClicked.emit();
  }
  downloadJpg() {
    this.downloadJpgButtonClicked.emit();
  }
  downloadTif() {
    this.downloadTifButtonClicked.emit();
  }
  updateFilter(type: string, value: string) {
    // console.log('updateFilter', type, value);
    if (type === 'variable') {
      this.selectedFilters.variable = value;
      const availableStatistics = ['daily_max', 'daily_min', 'daily_sum', 'daily_avg'];
      const availableStat = availableStatistics.find(stat => this.isTabEnabled(value, stat));

      if (!availableStat || !this.isTabEnabled(value, this.selectedFilters.statistic)) {
        this.selectedFilters.statistic = availableStat ?? '';
      }

    } else if (type === 'statistic') {
      this.selectedFilters.statistic = value;
    }

    this.filterChange.emit({ [type]: value });
  }

  onTimeSeriesUpdated(data: any) {
    this.multi = data;
  }
  
  isTabEnabled(variable: string, statistic: string): boolean {
    return this.activeTabs[variable]?.includes(statistic);
  }
}
