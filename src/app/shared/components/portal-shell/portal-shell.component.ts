import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Params, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export interface PortalShellNavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  hint?: string;
}

export interface PortalShellNavSection {
  title: string;
  items: PortalShellNavItem[];
}

export interface PortalShellQuickAction {
  label: string;
  path: string;
  icon: string;
  description: string;
  queryParams?: Params;
}

export interface PortalShellMetric {
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-shell.component.html',
})
export class PortalShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() roleLabel = '';
  @Input() email = '';
  @Input() accentClass = 'from-sky-700 via-sky-600 to-cyan-500';
  @Input() activeItemClass = 'bg-sky-50 text-sky-800 ring-1 ring-sky-100';
  @Input() badgeClass = 'bg-white/15 text-white';
  @Input() summaryTitle = '';
  @Input() summaryText = '';
  @Input() avatarLetter = '';
  @Input() navSections: PortalShellNavSection[] = [];
  @Input() quickActions: PortalShellQuickAction[] = [];
  @Input() metrics: PortalShellMetric[] = [];

  constructor(private readonly router: Router) {}

  runQuickAction(action: PortalShellQuickAction): void {
    void this.router.navigate([action.path], {
      queryParams: {
        ...(action.queryParams ?? {}),
        _qa: Date.now().toString(),
      },
    });
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_impersonated_user_id');
    void this.router.navigate(['/login']);
  }
}
