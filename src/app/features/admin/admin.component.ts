import { Component } from '@angular/core';
import {
  PortalShellComponent,
  PortalShellMetric,
  PortalShellNavSection,
  PortalShellQuickAction,
} from '../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [PortalShellComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent {
  readonly navSections: PortalShellNavSection[] = [
    {
      title: 'Воинский учет',
      items: [
        { id: 'dashboard', path: '/admin/dashboard', label: 'Панель управления', icon: '📊', hint: 'Сводка по учету и связанным службам' },
        { id: 'conscripts', path: '/admin/conscripts', label: 'Призывники', icon: '🧑‍✈️', hint: 'Только мужчины 18-27 лет призывного возраста' },
        { id: 'citizens', path: '/admin/citizens', label: 'Граждане', icon: '👥', hint: 'Полный контур граждан и разделов учета' },
        { id: 'education-registry', path: '/admin/education-registry', label: 'Реестр по образованию', icon: '🗂️', hint: 'Школа, колледж и влияние на отсрочку' },
        { id: 'deferment-review', path: '/admin/deferment-review', label: 'Проверка отсрочек', icon: '✅', hint: 'Семья, учеба и основания освобождения' },
      ],
    },
    {
      title: 'Внешние источники',
      items: [
        { id: 'school', path: '/admin/school', label: 'Школа', icon: '🏫', hint: 'Сведения об учащихся и выпускниках' },
        { id: 'university', path: '/admin/university', label: 'ВУЗ и колледж', icon: '🎓', hint: 'Зачисление, обучение и отчисления' },
        { id: 'organizations', path: '/admin/organizations', label: 'Организации', icon: '🏛️', hint: 'Справочники и подведомственные учреждения' },
      ],
    },
    {
      title: 'Контроль',
      items: [
        { id: 'expulsions', path: '/admin/expulsions', label: 'Отчисления', icon: '⚠️', hint: 'Кого нужно повторно вызвать' },
        { id: 'reports', path: '/admin/reports', label: 'Отчеты', icon: '📄', hint: 'Сводки по районам и категориям' },
        { id: 'settings', path: '/admin/settings', label: 'Настройки', icon: '⚙️', hint: 'Параметры автоматизации и справочников' },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    { path: '/admin/conscripts', label: 'Открыть призывников', icon: '🧾', description: 'Только мужчины 18-27 лет без смешивания с общим реестром' },
    { path: '/admin/citizens', label: 'Открыть граждан', icon: '👥', description: 'Полный список граждан с разделами военкомата' },
    { path: '/admin/deferment-review', label: 'Проверить отсрочки', icon: '🛡️', description: 'Быстрый переход к семейным и учебным основаниям' },
    { path: '/admin/reports', label: 'Сформировать отчет', icon: '📈', description: 'Сводка по районам, возрасту и этапам учета' },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Контур', value: 'Единый', hint: 'Рождение, ЗАГС, адрес, учеба и ВВК связаны' },
    { label: 'Логика', value: 'Семья', hint: 'Льготы считаются по мужу, жене и детям' },
    { label: 'Режим', value: 'Онлайн', hint: 'Работа через единые реестры без ручного дублирования' },
  ];
}
