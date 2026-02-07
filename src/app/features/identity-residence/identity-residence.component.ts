import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-identity-residence',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './identity-residence.component.html',
  styleUrl: './identity-residence.component.css'
})
export class IdentityResidenceComponent {
  menuItems = [
    { path: '/identity-residence/jek', label: 'ЖЭК', icon: '🏠' },
    { path: '/identity-residence/passport', label: 'Паспорт', icon: '🛂' },
    { path: '/identity-residence/audit', label: 'История изменений', icon: '🕒' }
  ];
}
