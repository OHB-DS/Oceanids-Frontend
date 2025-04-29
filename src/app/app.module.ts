import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './components/map/map.component';
import { NgxChartsModule, LineChartModule } from '@swimlane/ngx-charts';
import { DatePipe } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { KeycloakAngularModule } from 'keycloak-angular';
import { KeycloakBearerInterceptorInterceptor } from './shared/interceptior/keycloak-bearer-interceptor.interceptor';
import { NetworkInterceptor } from './shared/interceptior/network.interceptor';
import { LineChartComponent } from './components/line-chart/line-chart.component';
import { CapitalAndSpacePipe } from './shared/pipe/capital-and-space.pipe';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DescriptionSnackbarComponent } from './shared/components/description-snackbar/description-snackbar.component';
import { SpinnerInterceptor } from './shared/interceptor/spinner-interceptor';
import { NgxSpinnerModule } from 'ngx-spinner';
// function initializeKeycloak(keycloak: KeycloakService) {
//   return () =>
//     keycloak.init({
//       config: {
//         url: environment.keycloak_url,
//         realm: environment.keycloak_realm,
//         clientId: environment.keycloak_client_id
//       },
//       initOptions: {
//         onLoad: 'login-required',
//         checkLoginIframe: false
//       },
//       enableBearerInterceptor: true,
//       bearerExcludedUrls: ['/assets']

//     })
// }

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    LineChartComponent,
    CapitalAndSpacePipe,
    DescriptionSnackbarComponent

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    NgxSpinnerModule,
    MatFormFieldModule,
    MatSidenavModule,
    MatButtonModule,
    MatStepperModule,
    MatIconModule,
    MatTreeModule,
    MatTableModule,
    MatPaginatorModule,
    NgxChartsModule,
    MatTabsModule,
    MatExpansionModule,
    MatInputModule,
    MatDatepickerModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatListModule,
    MatNativeDateModule,
    MatRadioModule,
    MatMenuModule,
    MatBadgeModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    HttpClientModule,
    MatTooltipModule,
    MatCheckboxModule,
    KeycloakAngularModule,
    NgxChartsModule,
    LineChartModule,
    MatButtonToggleModule
  ],
  providers: [

    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeKeycloak,
    //   multi: true,
    //   deps: [KeycloakService],
    // },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: NetworkInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SpinnerInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: KeycloakBearerInterceptorInterceptor,
      multi: true
    },
    CapitalAndSpacePipe,
    HttpClient,
    DatePipe,
    MatDatepickerModule,
    HttpClientModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
