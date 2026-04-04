import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Customer } from '../../core/models';
import { CustomersApiService } from '../../core/customers-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.scss'
})
export class CustomersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CustomersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiPreferencesService);

  customers: Customer[] = [];
  loading = true;
  error = '';

  readonly form = this.fb.nonNullable.group({
    q: ''
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('q') ?? '';
    this.form.patchValue({ q }, { emitEvent: false });

    this.form.controls.q.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe((value) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: value || null },
          queryParamsHandling: ''
        });
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef), switchMap((params) => this.api.list(params.get('q') ?? undefined)))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadCustomersFailed');
          this.loading = false;
        }
      });
  }

  deleteCustomer(id: string): void {
    if (!window.confirm(this.ui.translate('messages.confirmDeleteCustomer'))) return;

    this.api.delete(id).subscribe({
      next: () => {
        this.customers = this.customers.filter((customer) => customer.id !== id);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }
}
