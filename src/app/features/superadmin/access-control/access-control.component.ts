import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, SelectComponent, SelectOption, InputComponent } from '../../../shared/components';

type UserRole =
  | 'superadmin'
  | 'admin'
  | 'teacher'
  | 'student'
  | 'maternity'
  | 'zags'
  | 'identity-residence'
  | 'school'
  | 'university'
  | 'clinic'
  | 'vvk'
  | 'border';

interface AccessUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked';
  accessLevel: string;
}

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, SelectComponent, InputComponent],
  templateUrl: './access-control.component.html',
  styleUrl: './access-control.component.css'
})
export class AccessControlComponent {
  roleFilter: UserRole | 'all' = 'all';
  searchQuery = '';

  roleOptions: SelectOption[] = [
    { value: 'all', label: 'Все роли' },
    { value: 'superadmin', label: 'Суперадмин' },
    { value: 'admin', label: 'Администратор' },
    { value: 'teacher', label: 'Преподаватель' },
    { value: 'student', label: 'Студент' },
    { value: 'maternity', label: 'Роддом' },
    { value: 'zags', label: 'ЗАГС' },
    { value: 'identity-residence', label: 'ЖЭК/Паспортный' },
    { value: 'school', label: 'Школа' },
    { value: 'university', label: 'ВУЗ/Колледж' },
    { value: 'clinic', label: 'Медцентр/Поликлиника' },
    { value: 'vvk', label: 'ВВК' },
    { value: 'border', label: 'Пограничная служба' }
  ];

  columns: TableColumn[] = [
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Роль', sortable: true },
    { key: 'accessLevel', label: 'Доступ', sortable: true },
    { key: 'status', label: 'Статус', sortable: true }
  ];

  users: AccessUser[] = [
    { id: 'sa-1', fullName: 'Суперадмин Системы', email: 'superadmin@example.com', role: 'superadmin', status: 'active', accessLevel: 'Полный' },
    { id: 'u-1', fullName: 'Админ Системы', email: 'admin@example.com', role: 'admin', status: 'active', accessLevel: 'Полный' },
    { id: 'u-2', fullName: 'ГКБ №12 Роддом', email: 'maternity@example.com', role: 'maternity', status: 'active', accessLevel: 'Ограниченный' },
    { id: 'u-3', fullName: 'ЗАГС Центральный', email: 'zags@example.com', role: 'zags', status: 'active', accessLevel: 'Ограниченный' },
    { id: 'u-4', fullName: 'ЖЭК Центральный', email: 'residence@example.com', role: 'identity-residence', status: 'active', accessLevel: 'Ограниченный' },
    { id: 'u-5', fullName: 'Поликлиника №1', email: 'clinic@example.com', role: 'clinic', status: 'active', accessLevel: 'Ограниченный' },
    { id: 'u-6', fullName: 'ВВК Центральная', email: 'vvk@example.com', role: 'vvk', status: 'active', accessLevel: 'Ограниченный' }
  ];

  get filteredUsers(): AccessUser[] {
    const byRole = this.roleFilter;
    const query = this.searchQuery.toLowerCase();

    return this.users.filter(user => {
      const roleMatches = byRole === 'all' || user.role === byRole;
      const queryMatches =
        !query ||
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      return roleMatches && queryMatches;
    });
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      superadmin: 'Суперадмин',
      admin: 'Администратор',
      teacher: 'Преподаватель',
      student: 'Студент',
      maternity: 'Роддом',
      zags: 'ЗАГС',
      'identity-residence': 'ЖЭК/Паспортный',
      school: 'Школа',
      university: 'ВУЗ/Колледж',
      clinic: 'Медцентр/Поликлиника',
      vvk: 'ВВК',
      border: 'Пограничная служба'
    };
    return labels[role] || role;
  }

  getStatusLabel(status: AccessUser['status']): string {
    return status === 'active' ? 'Активен' : 'Заблокирован';
  }
}
