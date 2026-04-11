import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-clinic',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './clinic.component.html',
  styleUrl: './clinic.component.css'
})
export class ClinicComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.clearToken();
    void this.router.navigate(['/login']);
  }

  menuItems = [
    { path: '/clinic/records', label: 'Карта пациента', icon: '🩺' }
  ];
}
