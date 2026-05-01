import { Routes } from '@angular/router';
import { AdminComponent } from './features/admin/admin.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { CitizensComponent } from './features/admin/citizens/citizens.component';
import { CitizenDetailComponent } from './features/admin/citizen-detail/citizen-detail.component';
import { SchoolComponent } from './features/admin/school/school.component';
import { UniversityComponent } from './features/admin/university/university.component';
import { ReportsComponent } from './features/admin/reports/reports.component';
import { EducationRegistryComponent } from './features/admin/education-registry/education-registry.component';
import { DefermentReviewComponent } from './features/admin/deferment-review/deferment-review.component';
import { ExpulsionNotificationsComponent } from './features/admin/expulsion-notifications/expulsion-notifications.component';
import { OrganizationsComponent } from './features/admin/organizations/organizations.component';
import { UsersComponent } from './features/admin/users/users.component';
import { AdminAuditComponent } from './features/admin/audit/admin-audit.component';
import { AdminSettingsComponent } from './features/admin/settings/admin-settings.component';
import { LoginComponent } from './features/auth/login/login.component';
import { ZagsComponent } from './features/zags/zags.component';
import { ZagsActListComponent } from './features/zags/zags-act-list/zags-act-list.component';
import { ZagsActViewComponent } from './features/zags/zags-act-view/zags-act-view.component';
import { JekComponent } from './features/jek/jek.component';
import { JekFamiliesComponent } from './features/jek/jek-families/jek-families.component';
import { JekRegistryComponent } from './features/jek/jek-registry/jek-registry.component';
import { PassportComponent } from './features/passport/passport.component';
import { PassportRegistryComponent } from './features/passport/passport-registry/passport-registry.component';
import { SchoolComponent as SchoolPortalComponent } from './features/school/school.component';
import { SchoolStudyListComponent } from './features/school/school-study-list/school-study-list.component';
import { MaternityComponent } from './features/maternity/maternity.component';
import { BirthRecordListComponent } from './features/maternity/birth-record-list/birth-record-list.component';
import { BirthRecordViewComponent } from './features/maternity/birth-record-view/birth-record-view.component';
import { UniversityComponent as UniversityPortalComponent } from './features/university/university.component';
import { UniversityStudyListComponent } from './features/university/university-study-list/university-study-list.component';
import { UniversityStudyDetailComponent } from './features/university/university-study-detail/university-study-detail.component';
import { ClinicComponent } from './features/clinic/clinic.component';
import { MedicalRecordReadComponent } from './features/clinic/medical-record-read/medical-record-read.component';
import { VvkComponent } from './features/vvk/vvk.component';
import { VvkQueueComponent } from './features/vvk/vvk-queue/vvk-queue.component';
import { BorderComponent } from './features/border/border.component';
import { BorderCrossingListComponent } from './features/border/border-crossing-list/border-crossing-list.component';
import { SuperadminComponent } from './features/superadmin/superadmin.component';
import { AccessControlComponent } from './features/superadmin/access-control/access-control.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'login/admin', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/maternity', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/zags', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/jek', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/passport', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/school', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/university', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/clinic', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/vvk', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/border', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login/superadmin', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'conscripts', component: CitizensComponent, data: { mode: 'conscripts' } },
      { path: 'citizens', component: CitizensComponent, data: { mode: 'citizens' } },
      { path: 'citizens/:id', component: CitizenDetailComponent },
      { path: 'education-registry', component: EducationRegistryComponent },
      { path: 'deferment-review', component: DefermentReviewComponent },
      { path: 'expulsions', component: ExpulsionNotificationsComponent },
      { path: 'school', component: SchoolComponent },
      { path: 'university', component: UniversityComponent },
      { path: 'organizations', component: OrganizationsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'audit', component: AdminAuditComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: AdminSettingsComponent }
    ]
  },
  {
    path: 'maternity',
    component: MaternityComponent,
    children: [
      { path: '', redirectTo: 'birth-records', pathMatch: 'full' },
      { path: 'birth-records', component: BirthRecordListComponent },
      { path: 'birth-records/:id', component: BirthRecordViewComponent }
    ]
  },
  {
    path: 'zags',
    component: ZagsComponent,
    children: [
      { path: '', redirectTo: 'acts', pathMatch: 'full' },
      { path: 'acts', component: ZagsActListComponent },
      { path: 'acts/:id', component: ZagsActViewComponent }
    ]
  },
  {
    path: 'jek',
    component: JekComponent,
    children: [
      { path: '', redirectTo: 'registry', pathMatch: 'full' },
      { path: 'registry', component: JekRegistryComponent },
      { path: 'families', component: JekFamiliesComponent }
    ]
  },
  {
    path: 'passport',
    component: PassportComponent,
    children: [
      { path: '', redirectTo: 'registry', pathMatch: 'full' },
      { path: 'registry', component: PassportRegistryComponent }
    ]
  },
  {
    path: 'school',
    component: SchoolPortalComponent,
    children: [
      { path: '', redirectTo: 'studies', pathMatch: 'full' },
      { path: 'studies', component: SchoolStudyListComponent }
    ]
  },
  {
    path: 'university',
    component: UniversityPortalComponent,
    children: [
      { path: '', redirectTo: 'studies', pathMatch: 'full' },
      { path: 'studies', component: UniversityStudyListComponent },
      { path: 'studies/:id', component: UniversityStudyDetailComponent }
    ]
  },
  {
    path: 'clinic',
    component: ClinicComponent,
    children: [
      { path: '', redirectTo: 'records', pathMatch: 'full' },
      { path: 'records', component: MedicalRecordReadComponent }
    ]
  },
  {
    path: 'vvk',
    component: VvkComponent,
    children: [
      { path: '', redirectTo: 'queue', pathMatch: 'full' },
      { path: 'queue', component: VvkQueueComponent }
    ]
  },
  {
    path: 'border',
    component: BorderComponent,
    children: [
      { path: '', redirectTo: 'crossings', pathMatch: 'full' },
      { path: 'crossings', component: BorderCrossingListComponent }
    ]
  },
  {
    path: 'superadmin',
    component: SuperadminComponent,
    children: [
      { path: '', redirectTo: 'access', pathMatch: 'full' },
      { path: 'access', component: AccessControlComponent }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];
