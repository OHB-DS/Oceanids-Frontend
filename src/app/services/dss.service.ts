import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { dssOptionsType } from 'src/app/components/dss-panel/dss-panel.component';

const mock_response: dssOptionsType = {
  city: '',
  scenarios: ['sort term', 'long term', 'post event'],
  short_term: {
    perils: {
      temperature: {
        return_periods: [100, 200, 500],
      },
      wind: {
        return_periods: [10, 100, 150],
      },
      'sea level rise': {
        return_periods: [150, 250, 500],
      },
      deformation: {
        return_periods: [50, 60, 70],
      },
    },
  },
  long_term: {
    perils: {
      temperature: {
        return_periods: [100, 200, 500],
      },
      wind: {
        return_periods: [10, 100, 150],
      },
      'sea level rise': {
        return_periods: [150, 250, 500],
      },
      deformation: {
        return_periods: [50, 60, 70],
      },
    },
  },
  post_event_perils: {
    temperature: {
      return_periods: [100, 200, 500],
    },
    wind: {
      return_periods: [10, 100, 150],
    },
  },
};

interface DssOptionsResponse {
  city: string;
}

@Injectable({
  providedIn: 'root',
})
export class DssService {
  constructor(private http: HttpClient) {}

  getDSSOptions(
    city: string
  ): Observable<dssOptionsType | { status: boolean }> {
    mock_response['city'] = city;
    return of(mock_response);
    // return this.http.get<DssOptionsResponse>(`/api/dss-options/${city}`).pipe(
    //   catchError((error) => {
    //     console.error('Error fetching DSS options:', error);
    //     return of({ status: false });
    //   })
    // );
  }
}
