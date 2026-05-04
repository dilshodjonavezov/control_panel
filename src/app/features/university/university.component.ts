import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';
import { AuthService } from '../../services/auth.service';

type InstitutionKind = 'college' | 'institute' | 'university' | 'education';

@Component({
  selector: 'app-university',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './university.component.html',
  styleUrl: './university.component.css',
})
export class UniversityComponent {
  readonly currentUser;
  readonly institutionName;
  readonly accountEmail;
  readonly avatarLetter;
  readonly institutionKind: InstitutionKind;
  readonly roleLabel;
  readonly subtitle;
  readonly summaryTitle;
  readonly summaryText;

  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Учебный учет',
      items: [
        {
          id: 'studies',
          path: '/university/studies',
          label: 'Студенты и обучение',
          icon: '🎓',
          hint: 'Реестр студентов, специальностей и статусов обучения только этого учреждения',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/university/studies',
      label: 'Добавить студента',
      icon: '➕',
      description: 'Открыть форму новой записи об обучении для своего учреждения',
      queryParams: { action: 'create' },
    },
    {
      path: '/university/studies',
      label: 'Риск отчисления',
      icon: '⚠️',
      description: 'Перейти к записям, которые влияют на отсрочку и статус обучения',
      queryParams: { action: 'expulsions' },
    },
    {
      path: '/university/studies',
      label: 'Учебная отсрочка',
      icon: '🛡️',
      description: 'Показать записи, связанные с активной учебной отсрочкой',
      queryParams: { action: 'deferment' },
    },
  ];

  readonly metrics: PortalShellMetric[];

  constructor(private readonly authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
    this.institutionName = this.currentUser?.organizationName?.trim() || 'Учебное учреждение';
    this.accountEmail = this.currentUser?.email?.trim() || 'education@example.com';
    this.avatarLetter = this.institutionName.charAt(0).toUpperCase() || 'У';
    this.institutionKind = this.detectInstitutionKind(this.institutionName);
    this.roleLabel = this.getRoleLabel(this.institutionKind);
    this.subtitle = this.getSubtitle(this.institutionKind);
    this.summaryTitle = this.institutionName;
    this.summaryText = `Этот кабинет ведет только студентов и записи обучения своего учреждения. Создание самих заведений делает только админ.`;
    this.metrics = [
      {
        label: 'Учреждение',
        value: this.institutionName,
        hint: 'Кабинет работает только со своим учреждением, а не с реестром всех заведений',
      },
      {
        label: 'Фокус',
        value: 'Студенты',
        hint: 'Здесь ведутся поступление, обучение, выпуск и отчисление студентов',
      },
      {
        label: 'Связь',
        value: 'Военкомат',
        hint: 'Статус учебы влияет на отсрочки и дальнейший военный учет',
      },
    ];
  }

  private detectInstitutionKind(name: string): InstitutionKind {
    const normalized = name.toLowerCase();

    if (normalized.includes('колледж')) {
      return 'college';
    }

    if (normalized.includes('институт')) {
      return 'institute';
    }

    if (normalized.includes('университет') || normalized.includes('вуз')) {
      return 'university';
    }

    return 'education';
  }

  private getRoleLabel(kind: InstitutionKind): string {
    switch (kind) {
      case 'college':
        return 'Колледж';
      case 'institute':
        return 'Институт';
      case 'university':
        return 'Университет';
      default:
        return 'Учебное учреждение';
    }
  }

  private getSubtitle(kind: InstitutionKind): string {
    switch (kind) {
      case 'college':
        return 'Рабочий кабинет конкретного колледжа. Здесь видны только свои студенты и свои записи обучения.';
      case 'institute':
        return 'Рабочий кабинет конкретного института. Здесь видны только свои студенты и свои записи обучения.';
      case 'university':
        return 'Рабочий кабинет конкретного университета. Здесь видны только свои студенты и свои записи обучения.';
      default:
        return 'Рабочий кабинет конкретного учебного учреждения. Здесь видны только свои студенты и свои записи обучения.';
    }
  }
}
