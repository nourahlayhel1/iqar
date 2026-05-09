import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  forwardRef,
  inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UiPreferencesService } from './ui-preferences.service';

export interface UiDropdownOption {
  value: string;
  label?: string;
  labelKey?: string;
}

@Component({
  selector: 'app-ui-dropdown',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="dropdown-root" [class.open]="open" [class.disabled]="disabled">
      <button
        type="button"
        class="dropdown-trigger"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel || null"
        [attr.aria-expanded]="open"
        aria-haspopup="listbox"
        (click)="toggle()"
        (keydown)="handleTriggerKeydown($event)"
        (blur)="markAsTouched()"
      >
        <span class="dropdown-value" [class.placeholder]="!selectedOption">
          {{ selectedLabel }}
        </span>
        <svg class="dropdown-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="dropdown-panel" role="listbox" *ngIf="open">
        <button
          type="button"
          class="dropdown-option"
          *ngFor="let option of options"
          [class.active]="option.value === value"
          [attr.aria-selected]="option.value === value"
          role="option"
          (click)="selectOption(option.value)"
          (keydown)="handleOptionKeydown($event, option.value)"
        >
          {{ optionLabel(option) }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .dropdown-root {
        position: relative;
      }

      .dropdown-trigger {
        width: 100%;
        min-height: 46px;
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 0.85rem 0.95rem;
        background:
          linear-gradient(45deg, transparent 50%, var(--luxury-black) 50%) calc(100% - 1.22rem) calc(50% - 0.13rem) / 0.32rem 0.32rem no-repeat,
          linear-gradient(135deg, var(--luxury-black) 50%, transparent 50%) calc(100% - 0.95rem) calc(50% - 0.13rem) / 0.32rem 0.32rem no-repeat,
          linear-gradient(90deg, rgba(10, 10, 10, 0.08), rgba(10, 10, 10, 0.08)) calc(100% - 2.35rem) 50% / 1px 1.8rem no-repeat,
          #ffffff;
        color: var(--text);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2.5rem;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease,
          background-color 160ms ease;
      }

      .dropdown-root.open .dropdown-trigger,
      .dropdown-trigger:focus-visible {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 3px rgba(201, 169, 110, 0.16);
      }

      .dropdown-value {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.95rem;
        font-weight: 800;
      }

      .dropdown-value.placeholder {
        color: var(--muted);
      }

      .dropdown-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        display: none;
        transition: transform 180ms ease;
      }

      .dropdown-root.open .dropdown-icon {
        transform: rotate(180deg);
      }

      .dropdown-panel {
        position: absolute;
        top: calc(100% + 0.55rem);
        left: 0;
        right: 0;
        z-index: 2147483647;
        padding: 0.35rem;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 24px 70px -30px rgba(10, 10, 10, 0.42);
        backdrop-filter: blur(12px);
        max-height: 260px;
        overflow-y: auto;
        animation: dropdown-in 180ms ease both;
      }

      .dropdown-option {
        width: 100%;
        border: 0;
        border-radius: 8px;
        background: transparent;
        color: var(--text);
        text-align: start;
        padding: 0.64rem 0.75rem;
        font-size: 0.92rem;
        font-weight: 750;
        transition:
          background-color 160ms ease,
          color 160ms ease;
      }

      .dropdown-option:hover,
      .dropdown-option.active {
        background: color-mix(in srgb, var(--accent) 12%, transparent);
        color: var(--luxury-black);
      }

      .dropdown-root.disabled {
        opacity: 0.8;
      }

      @keyframes dropdown-in {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }

        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `
  ]
})
export class UiDropdownComponent implements ControlValueAccessor {
  @Input() options: UiDropdownOption[] = [];
  @Input() placeholder = '';
  @Input() ariaLabel = '';

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ui = inject(UiPreferencesService);

  value = '';
  open = false;
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private elevatedPanel?: HTMLElement;

  get selectedOption(): UiDropdownOption | undefined {
    return this.options.find((option) => option.value === this.value);
  }

  get selectedLabel(): string {
    if (this.selectedOption) {
      return this.optionLabel(this.selectedOption);
    }

    return this.placeholder || this.ui.translate('common.any');
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    if (disabled) {
      this.open = false;
    }
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }

    this.open = !this.open;
    this.syncPanelElevation();
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.open = true;
      this.syncPanelElevation();
      this.focusOptionForKey(event.key);
    }
  }

  handleOptionKeydown(event: KeyboardEvent, value: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(value);
      this.focusTrigger();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.open = false;
      this.syncPanelElevation();
      this.focusTrigger();
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.focusOptionForKey(event.key, event.currentTarget as HTMLElement);
    }
  }

  selectOption(value: string): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.open = false;
    this.syncPanelElevation();
  }

  markAsTouched(): void {
    this.onTouched();
  }

  optionLabel(option: UiDropdownOption): string {
    return option.labelKey ? this.ui.translate(option.labelKey) : option.label ?? option.value;
  }

  @HostListener('document:click', ['$event.target'])
  closeOnOutsideClick(target: EventTarget | null): void {
    if (!target || this.elementRef.nativeElement.contains(target as Node)) {
      return;
    }

    this.open = false;
    this.syncPanelElevation();
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    this.open = false;
    this.syncPanelElevation();
  }

  private syncPanelElevation(): void {
    if (!this.open) {
      if (this.elevatedPanel) {
        this.elevatedPanel.style.zIndex = '';
        this.elevatedPanel.style.position = '';
        this.elevatedPanel = undefined;
      }
      return;
    }

    const panel = this.elementRef.nativeElement.closest('.panel');
    if (panel instanceof HTMLElement) {
      panel.style.position = 'relative';
      panel.style.zIndex = '2147483647';
      this.elevatedPanel = panel;
    }
  }

  private focusOptionForKey(key: string, currentOption?: HTMLElement): void {
    requestAnimationFrame(() => {
      const optionNodes = this.elementRef.nativeElement.querySelectorAll('.dropdown-option') as NodeListOf<HTMLElement>;
      const options = Array.from(optionNodes);
      if (!options.length) {
        return;
      }

      const currentIndex = currentOption ? options.indexOf(currentOption) : options.findIndex((option) => option.classList.contains('active'));
      const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        key === 'Home'
          ? 0
          : key === 'End'
            ? options.length - 1
            : key === 'ArrowUp'
              ? Math.max(0, fallbackIndex - 1)
              : Math.min(options.length - 1, fallbackIndex + 1);

      options[nextIndex].focus();
    });
  }

  private focusTrigger(): void {
    requestAnimationFrame(() => {
      const trigger = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLButtonElement | null;
      trigger?.focus();
    });
  }
}
