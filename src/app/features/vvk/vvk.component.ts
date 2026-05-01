import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-vvk',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './vvk.component.html',
  styleUrl: './vvk.component.css',
})
export class VvkComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Военно-врачебная комиссия',
      items: [
        {
          id: 'queue',
          path: '/vvk/queue',
          label: 'Очередь ВВК',
          icon: '🩻',
          hint: 'Кто ожидает рассмотрения комиссией',
        },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    {
      path: '/vvk/queue',
      label: 'Результаты комиссии',
      icon: '📄',
      description: 'Показать все решения по годности',
      queryParams: { action: 'results' },
    },
    {
      path: '/clinic/records',
      label: 'Проверить медкарту',
      icon: '🧬',
      description: 'Открыть медицинские записи поликлиники',
      queryParams: { action: 'history' },
    },
    {
      path: '/admin/conscripts',
      label: 'Статус призывника',
      icon: '🛡️',
      description: 'Перейти в список призывников после решения комиссии',
      queryParams: { action: 'conscripts' },
    },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Комиссия', value: 'ВВК', hint: 'Финальная медицинская оценка для военного статуса' },
    { label: 'Источник', value: 'Поликлиника', hint: 'Решения опираются на ранее собранные медицинские данные' },
    { label: 'Итог', value: 'Статус', hint: 'Результат влияет на допуск, отсрочку или освобождение' },
  ];
}
