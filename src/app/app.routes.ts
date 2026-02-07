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
import { StudentComponent } from './features/student/student.component';
import { StudentDashboardComponent } from './features/student/dashboard/student-dashboard.component';
import { StudentProfileComponent } from './features/student/profile/student-profile.component';
import { StudentEducationComponent } from './features/student/education/student-education.component';
import { StudentDocumentsComponent } from './features/student/documents/student-documents.component';
import { StudentRequestsComponent } from './features/student/requests/student-requests.component';
import { StudentNotificationsComponent } from './features/student/notifications/student-notifications.component';
import { StudentSettingsComponent } from './features/student/settings/student-settings.component';
import { TeacherComponent } from './features/teacher/teacher.component';
import { TeacherDashboardComponent } from './features/teacher/dashboard/teacher-dashboard.component';
import { TeacherProfileComponent } from './features/teacher/profile/teacher-profile.component';
import { TeacherRegistryComponent } from './features/teacher/registry/teacher-registry.component';
import { TeacherSchoolComponent } from './features/teacher/school/teacher-school.component';
import { TeacherUniversityComponent } from './features/teacher/university/teacher-university.component';
import { TeacherDocumentsComponent } from './features/teacher/documents/teacher-documents.component';
import { TeacherRequestsComponent } from './features/teacher/requests/teacher-requests.component';
import { TeacherNotificationsComponent } from './features/teacher/notifications/teacher-notifications.component';
import { TeacherAuditComponent } from './features/teacher/audit/teacher-audit.component';
import { TeacherReportsComponent } from './features/teacher/reports/teacher-reports.component';
import { ZagsComponent } from './features/zags/zags.component';
import { ZagsActListComponent } from './features/zags/zags-act-list/zags-act-list.component';
import { ZagsActViewComponent } from './features/zags/zags-act-view/zags-act-view.component';
import { IdentityResidenceComponent } from './features/identity-residence/identity-residence.component';
import { CitizenSearchComponent } from './features/identity-residence/citizen-search/citizen-search.component';
import { CitizenDetailComponent as IdentityCitizenDetailComponent } from './features/identity-residence/citizen-detail/citizen-detail.component';
import { PassportListComponent } from './features/identity-residence/passport-list/passport-list.component';
import { HistoryAuditComponent } from './features/identity-residence/history-audit/history-audit.component';
import { SchoolComponent as SchoolPortalComponent } from './features/school/school.component';
import { SchoolStudyListComponent } from './features/school/school-study-list/school-study-list.component';
import { MaternityComponent } from './features/maternity/maternity.component';
import { BirthRecordListComponent } from './features/maternity/birth-record-list/birth-record-list.component';
import { BirthRecordViewComponent } from './features/maternity/birth-record-view/birth-record-view.component';
import { UniversityComponent as UniversityPortalComponent } from './features/university/university.component';
import { UniversityStudyListComponent } from './features/university/university-study-list/university-study-list.component';
import { ClinicComponent } from './features/clinic/clinic.component';
import { MedicalRecordReadComponent } from './features/clinic/medical-record-read/medical-record-read.component';
import { VvkComponent } from './features/vvk/vvk.component';
import { VvkQueueComponent } from './features/vvk/vvk-queue/vvk-queue.component';
import { BorderComponent } from './features/border/border.component';
import { BorderCrossingListComponent } from './features/border/border-crossing-list/border-crossing-list.component';
import { SuperadminComponent } from './features/superadmin/superadmin.component';
import { AccessControlComponent } from './features/superadmin/access-control/access-control.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'login/student',
    component: LoginComponent,
    data: { role: 'student' }
  },
  {
    path: 'login/admin',
    component: LoginComponent,
    data: { role: 'admin' }
  },
  {
    path: 'login/teacher',
    component: LoginComponent,
    data: { role: 'teacher' }
  },
  {
    path: 'login/maternity',
    component: LoginComponent,
    data: { role: 'maternity' }
  },
  {
    path: 'login/zags',
    component: LoginComponent,
    data: { role: 'zags' }
  },
  {
    path: 'login/identity-residence',
    component: LoginComponent,
    data: { role: 'identity-residence' }
  },
  {
    path: 'login/school',
    component: LoginComponent,
    data: { role: 'school' }
  },
  {
    path: 'login/university',
    component: LoginComponent,
    data: { role: 'university' }
  },
  {
    path: 'login/clinic',
    component: LoginComponent,
    data: { role: 'clinic' }
  },
  {
    path: 'login/vvk',
    component: LoginComponent,
    data: { role: 'vvk' }
  },
  {
    path: 'login/border',
    component: LoginComponent,
    data: { role: 'border' }
  },
  {
    path: 'login/superadmin',
    component: LoginComponent,
    data: { role: 'superadmin' }
  },
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'citizens',
        component: CitizensComponent
      },
      {
        path: 'citizens/:id',
        component: CitizenDetailComponent
      },
      {
        path: 'education-registry',
        component: EducationRegistryComponent
      },
      {
        path: 'deferment-review',
        component: DefermentReviewComponent
      },
      {
        path: 'expulsions',
        component: ExpulsionNotificationsComponent
      },
      {
        path: 'school',
        component: SchoolComponent
      },
      {
        path: 'university',
        component: UniversityComponent
      },
      {
        path: 'organizations',
        component: OrganizationsComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'audit',
        component: AdminAuditComponent
      },
      {
        path: 'reports',
        component: ReportsComponent
      },
      {
        path: 'settings',
        component: AdminSettingsComponent
      }
    ]
  },
  {
    path: 'student',
    component: StudentComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: StudentDashboardComponent
      },
      {
        path: 'profile',
        component: StudentProfileComponent
      },
      {
        path: 'education',
        component: StudentEducationComponent
      },
      {
        path: 'documents',
        component: StudentDocumentsComponent
      },
      {
        path: 'requests',
        component: StudentRequestsComponent
      },
      {
        path: 'notifications',
        component: StudentNotificationsComponent
      },
      {
        path: 'settings',
        component: StudentSettingsComponent
      }
    ]
  },
  {
    path: 'teacher',
    component: TeacherComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: TeacherDashboardComponent
      },
      {
        path: 'profile',
        component: TeacherProfileComponent
      },
      {
        path: 'registry',
        component: TeacherRegistryComponent
      },
      {
        path: 'school',
        component: TeacherSchoolComponent
      },
      {
        path: 'university',
        component: TeacherUniversityComponent
      },
      {
        path: 'documents',
        component: TeacherDocumentsComponent
      },
      {
        path: 'requests',
        component: TeacherRequestsComponent
      },
      {
        path: 'notifications',
        component: TeacherNotificationsComponent
      },
      {
        path: 'audit',
        component: TeacherAuditComponent
      },
      {
        path: 'reports',
        component: TeacherReportsComponent
      }
    ]
  },
  {
    path: 'maternity',
    component: MaternityComponent,
    children: [
      {
        path: '',
        redirectTo: 'birth-records',
        pathMatch: 'full'
      },
      {
        path: 'birth-records',
        component: BirthRecordListComponent
      },
      {
        path: 'birth-records/:id',
        component: BirthRecordViewComponent
      }
    ]
  },
  {
    path: 'zags',
    component: ZagsComponent,
    children: [
      {
        path: '',
        redirectTo: 'acts',
        pathMatch: 'full'
      },
      {
        path: 'acts',
        component: ZagsActListComponent
      },
      {
        path: 'acts/:id',
        component: ZagsActViewComponent
      }
    ]
  },
  {
    path: 'identity-residence',
    component: IdentityResidenceComponent,
    children: [
      {
        path: '',
        redirectTo: 'jek',
        pathMatch: 'full'
      },
      {
        path: 'citizens',
        redirectTo: 'jek',
        pathMatch: 'full'
      },
      {
        path: 'jek',
        component: CitizenSearchComponent
      },
      {
        path: 'passport',
        component: PassportListComponent
      },
      {
        path: 'citizens/:id',
        component: IdentityCitizenDetailComponent
      },
      {
        path: 'audit',
        component: HistoryAuditComponent
      }
    ]
  },
  {
    path: 'school',
    component: SchoolPortalComponent,
    children: [
      {
        path: '',
        redirectTo: 'studies',
        pathMatch: 'full'
      },
      {
        path: 'studies',
        component: SchoolStudyListComponent
      }
    ]
  },
  {
    path: 'university',
    component: UniversityPortalComponent,
    children: [
      {
        path: '',
        redirectTo: 'studies',
        pathMatch: 'full'
      },
      {
        path: 'studies',
        component: UniversityStudyListComponent
      }
    ]
  },
  {
    path: 'clinic',
    component: ClinicComponent,
    children: [
      {
        path: '',
        redirectTo: 'records',
        pathMatch: 'full'
      },
      {
        path: 'records',
        component: MedicalRecordReadComponent
      }
    ]
  },
  {
    path: 'vvk',
    component: VvkComponent,
    children: [
      {
        path: '',
        redirectTo: 'queue',
        pathMatch: 'full'
      },
      {
        path: 'queue',
        component: VvkQueueComponent
      }
    ]
  },
  {
    path: 'border',
    component: BorderComponent,
    children: [
      {
        path: '',
        redirectTo: 'crossings',
        pathMatch: 'full'
      },
      {
        path: 'crossings',
        component: BorderCrossingListComponent
      }
    ]
  },
  {
    path: 'superadmin',
    component: SuperadminComponent,
    children: [
      {
        path: '',
        redirectTo: 'access',
        pathMatch: 'full'
      },
      {
        path: 'access',
        component: AccessControlComponent
      }
    ]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  }
];
