import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  constructor(private router: Router){}
  navigateTo(route: string) {
    this.router.navigate([route]);
  }
  openLoginPage() {
    window.open('https://ohbds-identitymanagement-dev.azurewebsites.net/realms/OCEANIDS_TEST/account', '_blank');
  }
}

