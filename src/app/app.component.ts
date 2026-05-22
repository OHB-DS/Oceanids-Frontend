import { Component } from '@angular/core';

import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  public isLoggedIn = false;
  userRoles: string[] = [];
  userFirstName: string = '';
  loading$ = new Observable<boolean>();
  showInstructionsModal = true;

  constructor(public loader: LoadingService, private readonly keycloak: KeycloakService) {
    this.loading$ = this.loader.loading$
  }

  closeInstructionsModal(): void {
    this.showInstructionsModal = false;
  }
}
