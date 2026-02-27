import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent, InputComponent, SelectComponent, SelectOption, CardComponent } from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, SelectComponent, CardComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  role = 'student';
  roleLocked = false;

  roleOptions: SelectOption[] = [
    // { value: 'student', label: 'Студент' },
    // { value: 'teacher', label: 'Преподаватель' },
    { value: 'admin', label: 'Администратор' },
    { value: 'maternity', label: 'Роддом' },
    { value: 'zags', label: 'ЗАГС' },
    { value: 'jek', label: 'ЖЭК' },
    { value: 'passport', label: 'Паспортный стол' },
    { value: 'school', label: 'Школа' },
    { value: 'university', label: 'ВУЗ/Колледж' },
    { value: 'clinic', label: 'Медцентр/Поликлиника' },
    { value: 'vvk', label: 'ВВК' },
    { value: 'border', label: 'Пограничная служба' },
    { value: 'superadmin', label: 'Суперадмин' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const roleFromRoute = this.route.snapshot.data['role'] as string | undefined;
    if (roleFromRoute) {
      this.role = roleFromRoute;
      this.roleLocked = true;
    }
  }

  submit(): void {
    if (this.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }
    if (this.role === 'teacher') {
      this.router.navigate(['/teacher/dashboard']);
      return;
    }
    if (this.role === 'maternity') {
      this.router.navigate(['/maternity/birth-records']);
      return;
    }
    if (this.role === 'zags') {
      this.router.navigate(['/zags/acts']);
      return;
    }
    if (this.role === 'jek') {
      this.router.navigate(['/jek/registry']);
      return;
    }
    if (this.role === 'passport') {
      this.router.navigate(['/passport/registry']);
      return;
    }
    if (this.role === 'school') {
      this.router.navigate(['/school/studies']);
      return;
    }
    if (this.role === 'university') {
      this.router.navigate(['/university/studies']);
      return;
    }
    if (this.role === 'clinic') {
      this.router.navigate(['/clinic/records']);
      return;
    }
    if (this.role === 'vvk') {
      this.router.navigate(['/vvk/queue']);
      return;
    }
    if (this.role === 'border') {
      this.router.navigate(['/border/crossings']);
      return;
    }
    if (this.role === 'superadmin') {
      this.router.navigate(['/superadmin/access']);
      return;
    }
    this.router.navigate(['/student/dashboard']);
  }
}
