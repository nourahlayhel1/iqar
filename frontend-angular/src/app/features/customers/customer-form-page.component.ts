import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { CustomersApiService } from '../../core/customers-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-customer-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './customer-form-page.component.html',
  styleUrl: './customer-form-page.component.scss'
})
export class CustomerFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiPreferencesService);

  mode: 'create' | 'edit' = 'create';
  customerId = '';
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    altPhone: [''],
    notes: ['']
  });

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return of(null);

          this.mode = 'edit';
          this.customerId = id;
          this.loading = true;
          return this.api.getById(id);
        })
      )
      .subscribe({
        next: (customer) => {
          if (customer) {
            this.form.patchValue({
              name: customer.name,
              phone: customer.phone,
              altPhone: customer.altPhone ?? '',
              notes: customer.notes ?? ''
            });
          }
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadCustomerFailed');
          this.loading = false;
        }
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    const payload = {
      name: this.form.controls.name.value,
      phone: this.form.controls.phone.value,
      altPhone: this.form.controls.altPhone.value || undefined,
      notes: this.form.controls.notes.value || undefined
    };

    const request$ = this.mode === 'create' ? this.api.create(payload) : this.api.update(this.customerId, payload);
    request$.subscribe({
      next: (customer) => {
        this.loading = false;
        void this.router.navigate(['/customers', customer.id]);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.saveCustomerFailed');
        this.loading = false;
      }
    });
  }
}
