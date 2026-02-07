import { Injectable, signal } from '@angular/core';

export type CitizenStatus = 'ACTIVE' | 'REMOVED' | 'ARCHIVED';
export type Gender = 'male' | 'female';
export type PassportStatus = 'ACTIVE' | 'EXPIRED' | 'ANNULLED';
export type AddressType = 'REGISTRATION' | 'RESIDENCE' | 'TEMPORARY';
export type MilStatus = 'ENLISTED' | 'REMOVED';

export interface PassportRecord {
  id: string;
  series: string;
  number: string;
  issuedBy: string;
  issueDate: string;
  expireDate: string;
  status: PassportStatus;
  notes?: string;
}

export interface AddressRecord {
  id: string;
  type: AddressType;
  region: string;
  district: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface MilRecord {
  id: string;
  office: string;
  enlistDate: string;
  category: string;
  status: MilStatus;
  notes?: string;
}

export interface AuditEntry {
  id: string;
  date: string;
  user: string;
  section: 'profile' | 'passport' | 'address' | 'military' | 'status';
  action: string;
  field?: string;
  before?: string;
  after?: string;
}

export interface CitizenRecord {
  id: string;
  iin: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  gender: Gender;
  citizenship: string;
  maritalStatus?: string;
  phone?: string;
  email?: string;
  status: CitizenStatus;
  district?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  passports: PassportRecord[];
  addresses: AddressRecord[];
  milRecords: MilRecord[];
  history: AuditEntry[];
}

@Injectable({ providedIn: 'root' })
export class IdentityCitizenService {
  private citizens = signal<CitizenRecord[]>([
    {
      id: 'CIT-100201',
      iin: '800101300123',
      firstName: 'Петр',
      lastName: 'Иванов',
      middleName: 'Павлович',
      birthDate: '1980-01-01',
      gender: 'male',
      citizenship: 'Казахстан',
      maritalStatus: 'женат',
      phone: '+7 701 111 22 33',
      email: 'ivanov@example.com',
      status: 'ACTIVE',
      district: 'Алмалинский',
      createdAt: '2025-12-12',
      createdBy: 'system',
      updatedAt: '2026-02-06',
      updatedBy: 'оператор',
      passports: [
        {
          id: 'P-1001',
          series: 'NQ',
          number: '123456',
          issuedBy: 'МВД РК',
          issueDate: '2020-05-12',
          expireDate: '2030-05-12',
          status: 'ACTIVE'
        }
      ],
      addresses: [
        {
          id: 'A-1001',
          type: 'REGISTRATION',
          region: 'Алматы',
          district: 'Алмалинский',
          city: 'Алматы',
          street: 'Абая',
          house: '10',
          apartment: '45',
          startDate: '2021-01-01',
          isActive: true
        }
      ],
      milRecords: [
        {
          id: 'M-1001',
          office: 'Военкомат Алмалинский',
          enlistDate: '1998-06-01',
          category: 'А',
          status: 'ENLISTED'
        }
      ],
      history: []
    },
    {
      id: 'CIT-100202',
      iin: '900305400987',
      firstName: 'Марина',
      lastName: 'Соколова',
      middleName: 'Андреевна',
      birthDate: '1990-03-05',
      gender: 'female',
      citizenship: 'Казахстан',
      maritalStatus: 'не замужем',
      phone: '+7 707 222 33 44',
      email: 'sokolova@example.com',
      status: 'ACTIVE',
      district: 'Бостандыкский',
      createdAt: '2026-01-15',
      createdBy: 'оператор',
      updatedAt: '2026-02-02',
      updatedBy: 'оператор',
      passports: [],
      addresses: [],
      milRecords: [],
      history: []
    },
    {
      id: 'CIT-100203',
      iin: '670912500456',
      firstName: 'Сергей',
      lastName: 'Поляков',
      middleName: 'Николаевич',
      birthDate: '1967-09-12',
      gender: 'male',
      citizenship: 'Казахстан',
      status: 'REMOVED',
      district: 'Ауэзовский',
      createdAt: '2024-10-20',
      createdBy: 'оператор',
      updatedAt: '2025-11-01',
      updatedBy: 'админ',
      passports: [],
      addresses: [],
      milRecords: [],
      history: []
    }
  ]);

  getCitizens() {
    return this.citizens.asReadonly();
  }

  getCitizenById(id: string): CitizenRecord | undefined {
    return this.citizens().find(c => c.id === id);
  }

  createCitizen(data: Omit<CitizenRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'history'>): CitizenRecord {
    const now = this.getToday();
    const record: CitizenRecord = {
      ...data,
      id: this.generateId('CIT'),
      createdAt: now,
      createdBy: 'оператор',
      updatedAt: now,
      updatedBy: 'оператор',
      history: []
    };
    this.citizens.update(list => [record, ...list]);
    this.addHistory(record.id, {
      section: 'profile',
      action: 'Создание записи'
    });
    return record;
  }

  updateCitizen(id: string, changes: Partial<CitizenRecord>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== id) return c;
        const updated: CitizenRecord = {
          ...c,
          ...changes,
          updatedAt: this.getToday(),
          updatedBy: 'оператор'
        };
        return updated;
      })
    );
    this.addHistory(id, { section: 'profile', action: 'Обновление профиля' });
  }

  changeStatus(ids: string[], status: CitizenStatus): void {
    this.citizens.update(list =>
      list.map(c =>
        ids.includes(c.id)
          ? { ...c, status, updatedAt: this.getToday(), updatedBy: 'оператор' }
          : c
      )
    );
    ids.forEach(id => this.addHistory(id, { section: 'status', action: `Смена статуса на ${status}` }));
  }

  softDelete(id: string, reason: string, hardDelete: boolean): void {
    if (hardDelete) {
      this.citizens.update(list => list.filter(c => c.id !== id));
      return;
    }
    this.updateCitizen(id, { status: 'REMOVED' });
    this.addHistory(id, { section: 'status', action: `Удаление (soft). Причина: ${reason}` });
  }

  addPassport(citizenId: string, data: Omit<PassportRecord, 'id'>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const next: PassportRecord = { ...data, id: this.generateId('P') };
        return { ...c, passports: [next, ...c.passports], updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'passport', action: 'Добавлен паспорт' });
  }

  updatePassport(citizenId: string, passportId: string, data: Partial<PassportRecord>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const passports = c.passports.map(p => (p.id === passportId ? { ...p, ...data } : p));
        return { ...c, passports, updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'passport', action: 'Обновлён паспорт' });
  }

  annulPassport(citizenId: string, passportId: string): void {
    this.updatePassport(citizenId, passportId, { status: 'ANNULLED' });
    this.addHistory(citizenId, { section: 'passport', action: 'Аннулирован паспорт' });
  }

  addAddress(citizenId: string, data: Omit<AddressRecord, 'id'>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        let addresses = c.addresses.map(a =>
          data.type === 'REGISTRATION' && data.isActive && a.type === 'REGISTRATION'
            ? { ...a, isActive: false, endDate: data.startDate }
            : a
        );
        const next: AddressRecord = { ...data, id: this.generateId('A') };
        addresses = [next, ...addresses];
        return { ...c, addresses, updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'address', action: 'Добавлен адрес' });
  }

  updateAddress(citizenId: string, addressId: string, data: Partial<AddressRecord>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const addresses = c.addresses.map(a => (a.id === addressId ? { ...a, ...data } : a));
        return { ...c, addresses, updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'address', action: 'Обновлён адрес' });
  }

  addMilRecord(citizenId: string, data: Omit<MilRecord, 'id'>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const next: MilRecord = { ...data, id: this.generateId('M') };
        return { ...c, milRecords: [next, ...c.milRecords], updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'military', action: 'Добавлен воинский учет' });
  }

  updateMilRecord(citizenId: string, recordId: string, data: Partial<MilRecord>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const milRecords = c.milRecords.map(m => (m.id === recordId ? { ...m, ...data } : m));
        return { ...c, milRecords, updatedAt: this.getToday(), updatedBy: 'оператор' };
      })
    );
    this.addHistory(citizenId, { section: 'military', action: 'Обновлён воинский учет' });
  }

  private addHistory(citizenId: string, data: Omit<AuditEntry, 'id' | 'date' | 'user'>): void {
    this.citizens.update(list =>
      list.map(c => {
        if (c.id !== citizenId) return c;
        const entry: AuditEntry = {
          id: this.generateId('H'),
          date: this.getToday(),
          user: 'оператор',
          ...data
        };
        return { ...c, history: [entry, ...c.history] };
      })
    );
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
}
