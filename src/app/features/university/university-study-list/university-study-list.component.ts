import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap, timeout } from 'rxjs';
import { CardComponent } from '../../../shared/components';
import { AuthService } from '../../../services/auth.service';
import {
  ApiEducationInstitution,
  CreateEducationInstitutionRequest,
  EducationInstitutionsService,
} from '../../../services/education-institutions.service';
import { OrganizationRecord, OrganizationsService } from '../../../services/organizations.service';

@Component({
  selector: 'app-university-study-list',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './university-study-list.component.html',
  styleUrl: './university-study-list.component.css',
})
export class UniversityStudyListComponent implements OnInit {
  isRedirectingToInstitution = true;
  errorMessage = '';
  institutionName = '';

  constructor(
    private readonly educationInstitutionsService: EducationInstitutionsService,
    private readonly organizationsService: OrganizationsService,
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.redirectToOwnInstitution();
  }

  private redirectToOwnInstitution(): void {
    const currentUser = this.authService.getCurrentUser();
    this.institutionName = currentUser?.organizationName?.trim() || 'Учебное учреждение';
    this.isRedirectingToInstitution = true;
    this.errorMessage = '';

    this.educationInstitutionsService
      .getAll()
      .pipe(
        timeout(15000),
        switchMap((institutions) =>
          this.organizationsService.getOrganizations().pipe(
            map((organizations) => ({ institutions, organizations })),
            catchError(() => of({ institutions, organizations: [] as OrganizationRecord[] })),
          ),
        ),
        switchMap(({ institutions, organizations }) => this.resolveInstitutionId(institutions, organizations)),
      )
      .subscribe({
        next: (institutionId) => {
          if (!institutionId) {
            this.errorMessage =
              `Не удалось открыть кабинет учреждения ${this.institutionName}. ` +
              'Проверьте привязку учреждения в административной части.';
            this.isRedirectingToInstitution = false;
            this.cdr.detectChanges();
            return;
          }

          void this.router.navigate(['/university/studies', institutionId], {
            queryParams: this.route.snapshot.queryParams,
            replaceUrl: true,
          });
        },
        error: () => {
          this.errorMessage = `Не удалось открыть кабинет учреждения ${this.institutionName}.`;
          this.isRedirectingToInstitution = false;
          this.cdr.detectChanges();
        },
      });
  }

  private resolveInstitutionId(
    institutions: ApiEducationInstitution[],
    organizations: OrganizationRecord[],
  ) {
    const currentUser = this.authService.getCurrentUser();
    const organization =
      organizations.find((item) => item.id === currentUser?.organizationId) ??
      organizations.find((item) => this.normalizeText(item.name) === this.normalizeText(currentUser?.organizationName)) ??
      null;

    const linkedByOrganizationId =
      organization?.educationInstitutionId && Number.isInteger(organization.educationInstitutionId)
        ? institutions.find((item) => item.id === organization.educationInstitutionId) ?? null
        : null;
    if (linkedByOrganizationId) {
      return of(linkedByOrganizationId.id);
    }

    const linkedByName = this.findLinkedInstitution(institutions, currentUser?.organizationName ?? '');
    if (linkedByName) {
      return this.persistOrganizationLink(organization, linkedByName.id);
    }

    const organizationName = currentUser?.organizationName?.trim() || organization?.name?.trim() || '';
    if (!organizationName) {
      return of<number | null>(null);
    }

    const payload: CreateEducationInstitutionRequest = {
      name: organizationName,
      type: this.resolveInstitutionType(organizationName, organization?.type),
      address: organization?.addressText?.trim() || '',
      description: 'Автоматически создано из кабинета учебного учреждения',
    };

    return this.educationInstitutionsService.createRecord(payload).pipe(
      switchMap((created) => this.persistOrganizationLink(organization, created.id)),
      catchError(() => of<number | null>(null)),
    );
  }

  private persistOrganizationLink(organization: OrganizationRecord | null, institutionId: number) {
    if (!organization?.id) {
      return of<number | null>(institutionId);
    }

    return this.organizationsService
      .updateOrganization(organization.id, { educationInstitutionId: institutionId })
      .pipe(
        map(() => institutionId),
        catchError(() => of<number | null>(institutionId)),
      );
  }

  private findLinkedInstitution(
    institutions: ApiEducationInstitution[],
    organizationName: string,
  ): ApiEducationInstitution | null {
    const filteredInstitutions = institutions.filter((institution) =>
      ['COLLEGE', 'UNIVERSITY', 'INSTITUTE'].includes((institution.type ?? '').trim().toUpperCase()),
    );
    const normalizedOrganizationName = this.normalizeText(organizationName);

    const exactMatch = filteredInstitutions.find(
      (institution) => this.normalizeText(institution.name) === normalizedOrganizationName,
    );
    if (exactMatch) {
      return exactMatch;
    }

    const partialMatch = filteredInstitutions.find((institution) => {
      const institutionName = this.normalizeText(institution.name);
      return !!normalizedOrganizationName && (
        institutionName.includes(normalizedOrganizationName) ||
        normalizedOrganizationName.includes(institutionName)
      );
    });

    return partialMatch ?? null;
  }

  private resolveInstitutionType(organizationName: string, organizationType?: string | null): string {
    const normalizedName = this.normalizeText(organizationName);
    if (normalizedName.includes('колледж')) {
      return 'COLLEGE';
    }
    if (normalizedName.includes('институт')) {
      return 'INSTITUTE';
    }
    const normalizedType = (organizationType ?? '').trim().toUpperCase();
    if (normalizedType === 'COLLEGE' || normalizedType === 'INSTITUTE' || normalizedType === 'UNIVERSITY') {
      return normalizedType;
    }
    return 'UNIVERSITY';
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }
}
