import { Injectable, signal } from '@angular/core';
import { Citizen, CitizenStatus, EducationRecord, DefermentRecord, EducationType, FitnessCategory } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CitizenService {
  private citizens = signal<Citizen[]>([]);
  private educationRecords = signal<EducationRecord[]>([]);
  private defermentRecords = signal<DefermentRecord[]>([]);

  constructor() {
    this.loadMockData();
  }

  // Граждане
  getCitizens() {
    return this.citizens.asReadonly();
  }

  getCitizenById(id: string): Citizen | undefined {
    return this.citizens().find(c => c.id === id);
  }

  createCitizen(citizen: Omit<Citizen, 'id' | 'createdAt' | 'updatedAt'>): Citizen {
    const newCitizen: Citizen = {
      ...citizen,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.citizens.update(list => [...list, newCitizen]);
    return newCitizen;
  }

  updateCitizen(id: string, updates: Partial<Citizen>): Citizen | null {
    const citizen = this.getCitizenById(id);
    if (!citizen) return null;

    const updated: Citizen = {
      ...citizen,
      ...updates,
      id,
      updatedAt: new Date()
    };
    this.citizens.update(list => list.map(c => c.id === id ? updated : c));
    return updated;
  }

  deleteCitizen(id: string): boolean {
    const exists = this.getCitizenById(id);
    if (exists) {
      this.citizens.update(list => list.filter(c => c.id !== id));
      // Удаляем связанные записи
      this.educationRecords.update(list => list.filter(e => e.citizenId !== id));
      this.defermentRecords.update(list => list.filter(d => d.citizenId !== id));
      return true;
    }
    return false;
  }

  // Записи об образовании
  getEducationRecords(citizenId?: string): EducationRecord[] {
    const records = this.educationRecords();
    return citizenId ? records.filter(r => r.citizenId === citizenId) : records;
  }

  createEducationRecord(record: Omit<EducationRecord, 'id'>): EducationRecord {
    const newRecord: EducationRecord = {
      ...record,
      id: this.generateId()
    };
    this.educationRecords.update(list => [...list, newRecord]);

    // Если есть право на отсрочку, создаем запись об отсрочке
    if (record.hasDeferment && record.isActive) {
      this.createDefermentRecord({
        citizenId: record.citizenId,
        educationRecordId: newRecord.id,
        startDate: record.startDate,
        isActive: true,
        reason: `Обучение в ${this.getEducationTypeLabel(record.educationType)}`,
        documentNumber: record.documentNumber || '',
        documentDate: record.documentDate || new Date(),
        militaryOfficeNotified: false
      });
    }

    return newRecord;
  }

  updateEducationRecord(id: string, updates: Partial<EducationRecord>): EducationRecord | null {
    const record = this.educationRecords().find(r => r.id === id);
    if (!record) return null;

    const updated: EducationRecord = {
      ...record,
      ...updates,
      id
    };
    this.educationRecords.update(list => list.map(r => r.id === id ? updated : r));

    // Если отчисление, снимаем отсрочку
    if (updates.isActive === false && record.hasDeferment) {
      this.defermentRecords.update(list =>
        list.map(d => {
          if (d.educationRecordId === id && d.isActive) {
            return {
              ...d,
              isActive: false,
              endDate: new Date(),
              militaryOfficeNotified: true,
              notificationDate: new Date()
            };
          }
          return d;
        })
      );
    }

    return updated;
  }

  // Отсрочки
  getDefermentRecords(citizenId?: string): DefermentRecord[] {
    const records = this.defermentRecords();
    return citizenId ? records.filter(r => r.citizenId === citizenId) : records;
  }

  hasActiveDeferment(citizenId: string): boolean {
    return this.defermentRecords().some(record => record.citizenId === citizenId && record.isActive);
  }

  createDefermentRecord(record: Omit<DefermentRecord, 'id'>): DefermentRecord {
    const newRecord: DefermentRecord = {
      ...record,
      id: this.generateId()
    };
    this.defermentRecords.update(list => [...list, newRecord]);
    return newRecord;
  }

  // Статистика
  getStatusDistribution(): Record<CitizenStatus, number> {
    const distribution: Record<CitizenStatus, number> = {
      [CitizenStatus.PRE_CONSCRIPT]: 0,
      [CitizenStatus.CONSCRIPT]: 0,
      [CitizenStatus.STUDENT]: 0,
      [CitizenStatus.FAMILY_CIRCUMSTANCES]: 0,
      [CitizenStatus.UNFIT_HEALTH]: 0,
      [CitizenStatus.ABROAD]: 0,
      [CitizenStatus.IN_SERVICE]: 0,
      [CitizenStatus.DEMOBILIZED]: 0
    };

    this.citizens().forEach(citizen => {
      distribution[citizen.status] = (distribution[citizen.status] || 0) + 1;
    });

    return distribution;
  }

  getTotalCitizens(): number {
    return this.citizens().length;
  }

  private getEducationTypeLabel(type: EducationType): string {
    const labels = {
      [EducationType.SCHOOL]: 'школе',
      [EducationType.UNIVERSITY]: 'ВУЗе',
      [EducationType.COLLEGE]: 'колледже',
      [EducationType.ABROAD]: 'за границей'
    };
    return labels[type] || '';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private loadMockData(): void {
    // Загружаем тестовые данные
    const mockCitizens: Citizen[] = [
      {
        id: '1',
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        birthDate: new Date('2005-05-15'),
        status: CitizenStatus.PRE_CONSCRIPT,
        fitnessCategory: FitnessCategory.FIT,
        registrationAddress: 'г. Москва, ул. Ленина, д. 1',
        phoneNumber: '+7 (999) 123-45-67',
        createdAt: new Date('2020-01-01'),
        updatedAt: new Date('2020-01-01')
      },
      {
        id: '2',
        firstName: 'Петр',
        lastName: 'Петров',
        middleName: 'Петрович',
        birthDate: new Date('2003-03-20'),
        status: CitizenStatus.STUDENT,
        fitnessCategory: FitnessCategory.FIT_WITH_LIMITATIONS,
        registrationAddress: 'г. Санкт-Петербург, ул. Невский проспект, д. 10',
        phoneNumber: '+7 (999) 234-56-78',
        createdAt: new Date('2020-01-02'),
        updatedAt: new Date('2021-09-01')
      }
    ];

    this.citizens.set(mockCitizens);
  }
}



