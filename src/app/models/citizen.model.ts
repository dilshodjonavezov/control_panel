// Модели данных для системы контроля отсрочек

export enum CitizenStatus {
  PRE_CONSCRIPT = 'pre_conscript', // Допризывник (1-17 лет)
  CONSCRIPT = 'conscript', // Призывник (активный статус)
  STUDENT = 'student', // Студент (отсрочка)
  FAMILY_CIRCUMSTANCES = 'family_circumstances', // Семейные обстоятельства (отсрочка)
  UNFIT_HEALTH = 'unfit_health', // Не годен по здоровью
  ABROAD = 'abroad', // Находится за границей
  IN_SERVICE = 'in_service', // На службе
  DEMOBILIZED = 'demobilized' // Дембель
}

export enum EducationType {
  SCHOOL = 'school', // Школа
  UNIVERSITY = 'university', // ВУЗ
  COLLEGE = 'college', // Колледж
  ABROAD = 'abroad' // За границей
}

export enum FitnessCategory {
  FIT = 'fit', // Годен
  FIT_WITH_LIMITATIONS = 'fit_with_limitations', // Годен с ограничениями
  TEMP_UNFIT = 'temp_unfit', // Временно не годен
  UNFIT = 'unfit' // Не годен
}

export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: Date;
  status: CitizenStatus;
  fitnessCategory?: FitnessCategory;
  registrationAddress: string;
  actualAddress?: string;
  phoneNumber?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EducationRecord {
  id: string;
  citizenId: string;
  educationType: EducationType;
  institutionName: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  hasDeferment: boolean; // Есть ли право на отсрочку
  documentNumber?: string; // Номер справки/приказа
  documentDate?: Date;
  notes?: string;
}

export interface DefermentRecord {
  id: string;
  citizenId: string;
  educationRecordId?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  reason: string;
  documentNumber: string;
  documentDate: Date;
  militaryOfficeNotified: boolean; // Уведомлен ли военкомат
  notificationDate?: Date;
}

export interface MilitaryServiceRecord {
  id: string;
  citizenId: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  unitName?: string;
  location?: string;
  notes?: string;
}



