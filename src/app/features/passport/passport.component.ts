import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-passport',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './passport.component.html',
  styleUrl: './passport.component.css'
})
export class PassportComponent {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.authService.clearToken();
    void this.router.navigate(['/login']);
  }

  menuItems = [
    { path: '/passport/registry', label: 'Паспортный реестр', icon: '🛂' }
  ];
}
