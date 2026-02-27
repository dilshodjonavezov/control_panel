import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-jek',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './jek.component.html',
  styleUrl: './jek.component.css'
})
export class JekComponent {
  menuItems = [
    { path: '/jek/registry', label: 'Реестр жильцов', icon: '🏠' }
  ];
}
