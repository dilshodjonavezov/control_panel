import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-jek',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './jek.component.html',
  styleUrl: './jek.component.css'
})
export class JekComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.clearToken();
    void this.router.navigate(['/login']);
  }

  menuItems = [
    { path: '/jek/registry', label: 'Реестр жильцов', icon: '🏠' }
  ];
}
