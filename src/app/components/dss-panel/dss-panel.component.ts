import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { DssService } from 'src/app/services/dss.service';

export interface dssOptionsType {
  city: string;
  scenarios: string[];
  short_term: {
    perils: {
      [key: string]: { return_periods: number[] };
    };
  };
  long_term: {
    perils: {
      [key: string]: { return_periods: number[] };
    };
  };
  post_event_perils: {
    [key: string]: { return_periods: number[] };
  };
}

@Component({
  selector: 'app-dss-panel',
  templateUrl: './dss-panel.component.html',
  styleUrl: './dss-panel.component.scss',
})
export class DssPanelComponent implements OnInit {
  constructor(private dssService: DssService) {}
  @Input() selectedCity: string = '';
  dssOptions: dssOptionsType | { status: boolean } = {
    city: '',
    scenarios: [],
    short_term: {
      perils: {},
    },
    long_term: {
      perils: {},
    },
    post_event_perils: {},
  };

  ngOnInit(): void {
    // this.selectedCity?.valueChanges.pipe(
    //     switchMap((city: string) => this.dssService.getDSSOptions(city))
    //   )
    //   .subscribe((response) => {
    //     this.dssOptions = response;
    //     console.log('DSS options:', this.dssOptions);
    //   });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.selectedCity && changes['selectedCity']) {
      this.dssService.getDSSOptions(this.selectedCity).subscribe((response) => {
        this.dssOptions = response;
        console.log('DSS options:', this.dssOptions);
      });
    }
  }
}
