import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, TableComponent, TableColumn, ButtonComponent, ModalComponent, InputComponent, SelectComponent, SelectOption } from '../../../shared/components';

type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student' | 'maternity' | 'zags' | 'jek' | 'passport' | 'school' | 'university' | 'clinic' | 'vvk' | 'border';

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked';
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, TableComponent, ButtonComponent, ModalComponent, InputComponent, SelectComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent {
  showModal = false;
  editing: UserItem | null = null;

  formData = {
    fullName: '',
    email: '',
    role: 'teacher' as UserRole
  };

  roleOptions: SelectOption[] = [
    { value: 'superadmin', label: 'Суперадмин' },
    { value: 'admin', label: 'Администратор' },
    { value: 'teacher', label: 'Преподаватель' },
    { value: 'student', label: 'Студент' },
    { value: 'maternity', label: 'Роддом' },
    { value: 'zags', label: 'ЗАГС' },
    { value: 'jek', label: 'ЖЭК' },
    { value: 'passport', label: 'Паспортный стол' },
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
    { key: 'status', label: 'Статус', sortable: true }
  ];

  users: UserItem[] = [
    { id: 'u0', fullName: 'Суперадмин Системы', email: 'superadmin@example.com', role: 'superadmin', status: 'active' },
    { id: 'u1', fullName: 'Админ Системы', email: 'admin@example.com', role: 'admin', status: 'active' },
    { id: 'u2', fullName: 'Смирнов А.И.', email: 'teacher@example.com', role: 'teacher', status: 'active' },
    { id: 'u3', fullName: 'Иванов И.И.', email: 'student@example.com', role: 'student', status: 'blocked' },
    { id: 'u4', fullName: 'ГКБ №12 Роддом', email: 'maternity@example.com', role: 'maternity', status: 'active' },
    { id: 'u5', fullName: 'ЗАГС Центральный', email: 'zags@example.com', role: 'zags', status: 'active' },
    { id: 'u6', fullName: 'ЖЭК Центральный', email: 'jek@example.com', role: 'jek', status: 'active' },
    { id: 'u12', fullName: 'Паспортный стол Центральный', email: 'passport@example.com', role: 'passport', status: 'active' },
    { id: 'u7', fullName: 'Школа №21', email: 'school@example.com', role: 'school', status: 'active' },
    { id: 'u8', fullName: 'Колледж №3', email: 'university@example.com', role: 'university', status: 'active' },
    { id: 'u9', fullName: 'Поликлиника №1', email: 'clinic@example.com', role: 'clinic', status: 'active' },
    { id: 'u10', fullName: 'ВВК Центральная', email: 'vvk@example.com', role: 'vvk', status: 'active' },
    { id: 'u11', fullName: 'Пограничная служба', email: 'border@example.com', role: 'border', status: 'active' }
  ];

  openAdd(): void {
    this.editing = null;
    this.formData = { fullName: '', email: '', role: 'teacher' };
    this.showModal = true;
  }

  openEdit(user: UserItem): void {
    this.editing = user;
    this.formData = { fullName: user.fullName, email: user.email, role: user.role };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editing = null;
  }

  save(): void {
    if (this.editing) {
      this.users = this.users.map(user =>
        user.id === this.editing!.id ? { ...user, ...this.formData } : user
      );
    } else {
      this.users = [
        { id: Date.now().toString(), ...this.formData, status: 'active' },
        ...this.users
      ];
    }
    this.closeModal();
  }

  toggleStatus(user: UserItem): void {
    this.users = this.users.map(item =>
      item.id === user.id ? { ...item, status: item.status === 'active' ? 'blocked' : 'active' } : item
    );
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      superadmin: 'Суперадмин',
      admin: 'Администратор',
      teacher: 'Преподаватель',
      student: 'Студент',
      maternity: 'Роддом',
      zags: 'ЗАГС',
      jek: 'ЖЭК',
      passport: 'Паспортный стол',
      school: 'Школа',
      university: 'ВУЗ/Колледж',
      clinic: 'Медцентр/Поликлиника',
      vvk: 'ВВК',
      border: 'Пограничная служба'
    };
    return labels[role] || role;
  }
}

