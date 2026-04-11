import { Injectable, signal } from '@angular/core';
import {
  Citizen,
  CitizenStatus,
  DefermentRecord,
  EducationRecord,
  EducationType,
  FitnessCategory
} from '../models';

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
    this.citizens.update(list => list.map(c => (c.id === id ? updated : c)));
    return updated;
  }

  deleteCitizen(id: string): boolean {
    const exists = this.getCitizenById(id);
    if (exists) {
      this.citizens.update(list => list.filter(c => c.id !== id));
      this.educationRecords.update(list => list.filter(e => e.citizenId !== id));
      this.defermentRecords.update(list => list.filter(d => d.citizenId !== id));
      return true;
    }
    return false;
  }

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
    this.educationRecords.update(list => list.map(r => (r.id === id ? updated : r)));

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
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  private loadMockData(): void {
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
      },
      {
        id: '3',
        firstName: 'Александр',
        lastName: 'Смирнов',
        middleName: 'Олегович',
        birthDate: new Date('2004-07-11'),
        status: CitizenStatus.CONSCRIPT,
        fitnessCategory: FitnessCategory.FIT,
        registrationAddress: 'г. Душанбе, ул. Рудаки, д. 18',
        actualAddress: 'г. Душанбе, ул. Айни, д. 42',
        phoneNumber: '+992 90 111 22 33',
        email: 'smirnov.a@test.local',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2026-03-02')
      },
      {
        id: '4',
        firstName: 'Мухаммад',
        lastName: 'Каримов',
        middleName: 'Саидович',
        birthDate: new Date('2005-01-28'),
        status: CitizenStatus.CONSCRIPT,
        fitnessCategory: FitnessCategory.FIT_WITH_LIMITATIONS,
        registrationAddress: 'г. Худжанд, 12 микрорайон, д. 7',
        actualAddress: 'г. Худжанд, ул. Исмоили Сомони, д. 25',
        phoneNumber: '+992 92 456 78 90',
        email: 'karimov.m@test.local',
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2026-03-05')
      },
      {
        id: '5',
        firstName: 'Рустам',
        lastName: 'Назаров',
        middleName: 'Фарходович',
        birthDate: new Date('2003-11-03'),
        status: CitizenStatus.CONSCRIPT,
        fitnessCategory: FitnessCategory.TEMP_UNFIT,
        registrationAddress: 'г. Бохтар, ул. Борбад, д. 14',
        actualAddress: 'г. Бохтар, ул. Вахдат, д. 9',
        phoneNumber: '+992 93 222 44 55',
        email: 'nazarov.r@test.local',
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2026-03-12')
      },
      {
        id: '6',
        firstName: 'Давлат',
        lastName: 'Юсупов',
        middleName: 'Махмудович',
        birthDate: new Date('2004-09-19'),
        status: CitizenStatus.CONSCRIPT,
        fitnessCategory: FitnessCategory.FIT,
        registrationAddress: 'г. Куляб, ул. Сомони, д. 31',
        actualAddress: 'г. Куляб, ул. Ломоносова, д. 6',
        phoneNumber: '+992 98 765 43 21',
        email: 'yusupov.d@test.local',
        createdAt: new Date('2024-04-20'),
        updatedAt: new Date('2026-03-18')
      },
      {
        id: '7',
        firstName: 'Фируз',
        lastName: 'Шарипов',
        middleName: 'Бахтиёрович',
        birthDate: new Date('2005-06-07'),
        status: CitizenStatus.CONSCRIPT,
        fitnessCategory: FitnessCategory.UNFIT,
        registrationAddress: 'г. Турсунзаде, ул. Мирзо Турсунзаде, д. 5',
        actualAddress: 'г. Турсунзаде, 1 микрорайон, д. 11',
        phoneNumber: '+992 95 333 66 77',
        email: 'sharipov.f@test.local',
        createdAt: new Date('2024-05-12'),
        updatedAt: new Date('2026-03-25')
      }
    ];

    this.citizens.set(mockCitizens);
  }
}
