import { Component } from '@angular/core';
import { OrganizationsComponent } from '../../admin/organizations/organizations.component';

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [OrganizationsComponent],
  templateUrl: './access-control.component.html',
  styleUrl: './access-control.component.css',
})
export class AccessControlComponent {}
