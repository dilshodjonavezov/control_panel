import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  @Input() title: string = '';
  @Input() show: boolean = false;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() closable: boolean = true;

  @Output() closed = new EventEmitter<void>();

  close(): void {
    if (this.closable) {
      this.show = false;
      this.closed.emit();
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget && this.closable) {
      this.close();
    }
  }

  get sizeClasses(): string {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl'
    };
    return sizes[this.size];
  }
}
