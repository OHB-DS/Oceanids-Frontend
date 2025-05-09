import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { LegendPosition } from '@swimlane/ngx-charts';
import { yAxisLabels } from 'src/app/shared/desctiptions/service-desctiptions';


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
  @Output() downloadCsvButtonClicked = new EventEmitter<void>();
  @Output() downloadJpgButtonClicked = new EventEmitter<void>();
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

  // colorScheme = {
  //   domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']
  // };
  colorScheme = 'cool';
  @Input() chartImage: string = '';
  //chartImage: string = '';
  downloadCsv() {
    this.downloadCsvButtonClicked.emit();
  }
  downloadJpg() {
    this.downloadJpgButtonClicked.emit();
  }
  updateFilter(type: string, value: string) {
    console.log({ [type]: value });
    this.filterChange.emit({ [type]: value });
  }
  onTimeSeriesUpdated(data: any) {
    this.multi = data;
  }
}
