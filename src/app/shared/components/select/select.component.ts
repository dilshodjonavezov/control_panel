import { Component, Input, Output, EventEmitter, forwardRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css'
})
export class SelectComponent implements ControlValueAccessor, OnChanges {
  @Input() label: string = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Выберите...';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() error: string = '';
  @Input() hint: string = '';
  @Input() id: string = '';
  @Input() value: string | number | null = null;
  @Output() changed = new EventEmitter<string | number | null>();

  // Внутреннее значение для ControlValueAccessor
  internalValue: string | number | null = null;
  private onChange = (value: string | number | null) => {};
  private onTouched = () => {};

  writeValue(value: string | number | null): void {
    this.internalValue = value;
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value || null;
    this.internalValue = newValue;
    this.value = newValue;
    this.onChange(newValue);
    this.changed.emit(newValue);
  }

  ngOnChanges(): void {
    if (this.value !== undefined && this.value !== this.internalValue) {
      this.internalValue = this.value;
    }
  }

  onBlur(): void {
    this.onTouched();
  }

  private generatedId = `select-${Math.random().toString(36).substr(2, 9)}`;

  get selectId(): string {
    return this.id || this.generatedId;
  }
}
