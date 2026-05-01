import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-zags',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './zags.component.html',
  styleUrl: './zags.component.css',
})
export class ZagsComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Акты гражданского состояния',
      items: [
        {
          id: 'acts',
          path: '/zags/acts',
          label: 'Реестр актов',
          icon: '📝',
          hint: 'Рождения, браки, смерти и ключевые записи ЗАГС',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/zags/acts',
      label: 'Регистрация рождения',
      icon: '👶',
      description: 'Открыть форму рождения и связать акт с записью роддома',
      queryParams: { action: 'birth' },
    },
    {
      path: '/zags/acts',
      label: 'Регистрация брака',
      icon: '💍',
      description: 'Открыть форму брака и обновить семейные связи',
      queryParams: { action: 'marriage' },
    },
    {
      path: '/zags/acts',
      label: 'Проверить акты',
      icon: '🗂️',
      description: 'Сбросить фильтры и открыть общий журнал записей',
      queryParams: { action: 'audit' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Семья', value: 'Связана', hint: 'Акты рождения и брака питают семейную модель' },
    { label: 'Передача', value: 'Сразу', hint: 'Новые записи обновляют ЖЭК и военкомат' },
    { label: 'Проверка', value: 'Единая', hint: 'Отец, мать и ребенок сверяются в одном контуре' },
  ];
}
