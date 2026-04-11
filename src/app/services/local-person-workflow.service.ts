import { Injectable } from '@angular/core';

export type UnifiedLifeStatus =
  | 'Школьник'
  | 'Учится в университете'
  | 'Свободен (ожидает)'
  | 'За границей'
  | 'Работает'
  | 'Другое (может быть указано в описании)'
  | 'Годен к службе'
  | 'Не годен к службе'
  | 'На службе'
  | 'Служба окончена';

type WorkflowSource = 'school' | 'university' | 'border' | 'vvk' | 'manual';

interface WorkflowHistoryEntry {
  at: string;
  source: WorkflowSource;
  status: UnifiedLifeStatus;
  note?: string;
}

interface WorkflowPersonState {
  fullName: string;
  currentStatus: UnifiedLifeStatus;
  history: WorkflowHistoryEntry[];
}

interface WorkflowStore {
  peopleByName: Record<string, WorkflowPersonState>;
  personNameById: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class LocalPersonWorkflowService {
  private readonly storageKey = 'local_person_workflow_v1';

  getRoadmap(): string[] {
    return [
      'Роддом/ЗАГС: рождение и ФИО ребенка',
      'Школа: статус Школьник',
      'Университет: Учится в университете или Свободен (ожидает)',
      'ВВК: Годен к службе / Не годен к службе',
      'Военкомат: На службе / Служба окончена',
      'Граница: За границей или возвращение в локальный статус',
    ];
  }

  linkPersonIdToName(personId: number, fullName: string): void {
    if (!Number.isInteger(personId) || personId <= 0) {
      return;
    }
    const normalizedName = this.normalizeName(fullName);
    if (!normalizedName) {
      return;
    }

    const store = this.readStore();
    store.personNameById[personId.toString()] = fullName.trim();
    this.writeStore(store);
  }

  getNameByPersonId(personId: number): string | null {
    const store = this.readStore();
    return store.personNameById[personId.toString()] || null;
  }

  getCurrentStatus(fullName: string): UnifiedLifeStatus | null {
    const state = this.getPersonState(fullName);
    return state?.currentStatus ?? null;
  }

  getPeopleWithStatus(status: UnifiedLifeStatus): string[] {
    const store = this.readStore();
    return Object.values(store.peopleByName)
      .filter((item) => item.currentStatus === status)
      .map((item) => item.fullName)
      .filter((item) => item.trim().length > 0);
  }

  setManualStatus(fullName: string, status: UnifiedLifeStatus, note?: string): void {
    this.setStatus(fullName, status, 'manual', note);
  }

  applySchoolStatus(fullName: string, schoolStatus: 'Учится' | 'Закончил' | 'Отчислен'): void {
    if (schoolStatus === 'Учится') {
      this.setStatus(fullName, 'Школьник', 'school');
      return;
    }

    if (schoolStatus === 'Закончил') {
      this.setStatus(fullName, 'Свободен (ожидает)', 'school', 'Окончание школы');
      return;
    }

    this.setStatus(fullName, 'Другое (может быть указано в описании)', 'school', 'Отчислен из школы');
  }

  applyUniversityStatus(
    fullName: string,
    universityStatus: 'ENROLLED' | 'EXPELLED',
    studyForm: 'FULL_TIME' | 'PART_TIME',
  ): void {
    if (universityStatus === 'ENROLLED') {
      if (studyForm === 'FULL_TIME') {
        this.setStatus(fullName, 'Учится в университете', 'university');
      } else {
        this.setStatus(fullName, 'Свободен (ожидает)', 'university', 'Заочная форма обучения');
      }
      return;
    }

    this.setStatus(fullName, 'Свободен (ожидает)', 'university', 'Отчисление из университета');
  }

  applyBorderState(fullName: string, outsideBorder: boolean): void {
    if (outsideBorder) {
      this.setStatus(fullName, 'За границей', 'border');
      return;
    }

    const current = this.getCurrentStatus(fullName);
    if (current === 'За границей') {
      this.setStatus(fullName, 'Свободен (ожидает)', 'border', 'Возвращение в страну');
    }
  }

  applyVvkQueueStatus(fullName: string, queueStatus: 'WAITING' | 'IN_REVIEW' | 'DONE'): void {
    if (queueStatus === 'DONE') {
      this.setStatus(fullName, 'Годен к службе', 'vvk');
      return;
    }

    if (queueStatus === 'IN_REVIEW') {
      this.setStatus(fullName, 'Другое (может быть указано в описании)', 'vvk', 'На рассмотрении ВВК');
      return;
    }

    this.setStatus(fullName, 'Свободен (ожидает)', 'vvk', 'Ожидание ВВК');
  }

  private setStatus(fullName: string, status: UnifiedLifeStatus, source: WorkflowSource, note?: string): void {
    const normalizedName = this.normalizeName(fullName);
    if (!normalizedName) {
      return;
    }

    const store = this.readStore();
    const existing = store.peopleByName[normalizedName];
    const resolvedName = fullName.trim() || existing?.fullName || normalizedName;

    const history: WorkflowHistoryEntry[] = existing?.history ? [...existing.history] : [];
    history.push({
      at: new Date().toISOString(),
      source,
      status,
      note,
    });

    store.peopleByName[normalizedName] = {
      fullName: resolvedName,
      currentStatus: status,
      history,
    };

    this.writeStore(store);
  }

  private getPersonState(fullName: string): WorkflowPersonState | null {
    const normalizedName = this.normalizeName(fullName);
    if (!normalizedName) {
      return null;
    }
    const store = this.readStore();
    return store.peopleByName[normalizedName] ?? null;
  }

  private readStore(): WorkflowStore {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return {
        peopleByName: {},
        personNameById: {},
      };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<WorkflowStore>;
      return {
        peopleByName: parsed.peopleByName ?? {},
        personNameById: parsed.personNameById ?? {},
      };
    } catch {
      return {
        peopleByName: {},
        personNameById: {},
      };
    }
  }

  private writeStore(store: WorkflowStore): void {
    localStorage.setItem(this.storageKey, JSON.stringify(store));
  }

  private normalizeName(value: string | null | undefined): string {
    return (value || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '')
      .trim();
  }
}
