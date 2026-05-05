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
      title: 'Воинский учёт',
      items: [
        { id: 'dashboard', path: '/voenkomat/dashboard', label: 'Панель управления', icon: '📊', hint: 'Сводка по учёту и связанным службам' },
        { id: 'conscripts', path: '/voenkomat/conscripts', label: 'Призывники', icon: '🧑‍✈️', hint: 'Только мужчины 18-27 лет призывного возраста' },
        { id: 'in-service', path: '/voenkomat/citizens', queryParams: { status: 'На службе' }, label: 'В армии', icon: '🪖', hint: 'Граждане, которых уже отправили на службу' },
        { id: 'citizens', path: '/voenkomat/citizens', label: 'Граждане', icon: '👥', hint: 'Полный контур граждан и разделов учёта' },
        { id: 'education-registry', path: '/voenkomat/education-registry', label: 'Реестр по образованию', icon: '🗂️', hint: 'Школа, колледж и влияние на отсрочку' },
        { id: 'deferment-review', path: '/voenkomat/deferment-review', label: 'Проверка отсрочек', icon: '✅', hint: 'Семья, учёба и основания освобождения' },
      ],
    },
    {
      title: 'Внешние источники',
      items: [
        { id: 'school', path: '/voenkomat/school', label: 'Школа', icon: '🏫', hint: 'Сведения об учащихся и выпускниках' },
        { id: 'university', path: '/voenkomat/university', label: 'ВУЗ и колледж', icon: '🎓', hint: 'Зачисление, обучение и отчисления' },
        { id: 'organizations', path: '/voenkomat/organizations', label: 'Организации', icon: '🏛️', hint: 'Справочники и подведомственные учреждения' },
      ],
    },
    {
      title: 'Контроль',
      items: [
        { id: 'expulsions', path: '/voenkomat/expulsions', label: 'Отчисления', icon: '⚠️', hint: 'Кого нужно повторно вызвать' },
        { id: 'reports', path: '/voenkomat/reports', label: 'Отчёты', icon: '📄', hint: 'Сводки по районам и категориям' },
        { id: 'settings', path: '/voenkomat/settings', label: 'Настройки', icon: '⚙️', hint: 'Параметры автоматизации и справочников' },
      ],
    },
  ];

  readonly quickActions: PortalShellQuickAction[] = [
    { path: '/voenkomat/conscripts', label: 'Открыть призывников', icon: '🧾', description: 'Только мужчины 18-27 лет без смешивания с общим реестром' },
    { path: '/voenkomat/citizens', label: 'Открыть граждан', icon: '👥', description: 'Полный список граждан с разделами военкомата' },
    { path: '/voenkomat/deferment-review', label: 'Проверить отсрочки', icon: '🛡️', description: 'Быстрый переход к семейным и учебным основаниям' },
    { path: '/voenkomat/reports', label: 'Сформировать отчёт', icon: '📈', description: 'Сводка по районам, возрасту и этапам учёта' },
  ];

  readonly metrics: PortalShellMetric[] = [
    { label: 'Контур', value: 'Единый', hint: 'Рождение, ЗАГС, адрес, учёба и ВВК связаны' },
    { label: 'Логика', value: 'Семья', hint: 'Льготы считаются по мужу, жене и детям' },
    { label: 'Режим', value: 'Онлайн', hint: 'Работа через единые реестры без ручного дублирования' },
  ];
}
