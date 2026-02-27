import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  TableComponent,
  InputComponent,
  SelectComponent,
  SelectOption,
  ButtonComponent,
  ModalComponent,
  type TableColumn,
} from '../../../shared/components';
import {
  CitizenReadCardComponent,
  CitizenReadCardData,
} from '../components/citizen-read-card/citizen-read-card.component';
import { BorderCrossingCreateEditComponent } from '../border-crossing-create-edit/border-crossing-create-edit.component';

interface BorderCrossingItem {
  id: string;
  citizenId: string;
  fullName: string;
  crossingDate: string;
  type: 'EXIT' | 'ENTRY';
  country: string;
  checkpoint: string;
}

@Component({
  selector: 'app-border-crossing-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    TableComponent,
    InputComponent,
    SelectComponent,
    ButtonComponent,
    ModalComponent,
    CitizenReadCardComponent,
    BorderCrossingCreateEditComponent,
  ],
  templateUrl: './border-crossing-list.component.html',
  styleUrl: './border-crossing-list.component.css',
})
export class BorderCrossingListComponent {
  filters = {
    fullName: '',
    type: 'all',
  };

  typeOptions: SelectOption[] = [
    { value: 'all', label: 'Все' },
    { value: 'EXIT', label: 'Выезд' },
    { value: 'ENTRY', label: 'Въезд' },
  ];

  columns: TableColumn[] = [
    { key: 'fullName', label: 'ФИО', sortable: true },
    { key: 'crossingDate', label: 'Дата', sortable: true },
    { key: 'type', label: 'Тип', sortable: true },
    { key: 'country', label: 'Страна', sortable: true },
    { key: 'checkpoint', label: 'КПП', sortable: true },
  ];

  crossings: BorderCrossingItem[] = [
    {
      id: 'bc-101',
      citizenId: 'CIT-771102',
      fullName: 'Иванов Петр Павлович',
      crossingDate: '25.01.2026',
      type: 'EXIT',
      country: 'Кыргызстан',
      checkpoint: 'КПП Алматы-1',
    },
    {
      id: 'bc-098',
      citizenId: 'CIT-552901',
      fullName: 'Соколова Марина Андреевна',
      crossingDate: '10.06.2025',
      type: 'ENTRY',
      country: 'Россия',
      checkpoint: 'КПП Нур-Султан',
    },
    {
      id: 'bc-095',
      citizenId: 'CIT-330115',
      fullName: 'Поляков Сергей Николаевич',
      crossingDate: '02.05.2025',
      type: 'EXIT',
      country: 'Грузия',
      checkpoint: 'КПП Актау',
    },
  ];

  selectedCitizen = signal<CitizenReadCardData | null>(null);
  showModal = false;
  selectedRecordId: string | null = null;

  get filteredCrossings(): BorderCrossingItem[] {
    const byName = this.filters.fullName.toLowerCase();
    const byType = this.filters.type;

    return this.crossings.filter((item) => {
      const matchesName = !byName || item.fullName.toLowerCase().includes(byName);
      const matchesType = byType === 'all' || item.type === byType;
      return matchesName && matchesType;
    });
  }

  selectCitizen(item: BorderCrossingItem): void {
    this.selectedCitizen.set({
      id: item.citizenId,
      iin: '800101300123',
      fullName: item.fullName,
      birthDate: '01.01.1980',
      status: item.type === 'EXIT' ? 'ABROAD' : 'ACTIVE',
      lastEntryDate: item.type === 'ENTRY' ? item.crossingDate : null,
    });
  }

  openCreate(): void {
    this.selectedRecordId = null;
    this.showModal = true;
  }

  openEdit(item: BorderCrossingItem): void {
    this.selectCitizen(item);
    this.selectedRecordId = item.id;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedRecordId = null;
  }

  getTypeLabel(type: BorderCrossingItem['type']): string {
    return type === 'EXIT' ? 'Выезд' : 'Въезд';
  }
}
