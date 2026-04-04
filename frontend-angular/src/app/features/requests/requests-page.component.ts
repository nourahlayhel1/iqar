import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { CustomersApiService } from '../../core/customers-api.service';
import { formatCurrency } from '../../core/formatters';
import { RequestsApiService } from '../../core/requests-api.service';
import { Customer, CustomerRequest, Property } from '../../core/models';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../core/ui-dropdown.component';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-requests-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UiDropdownComponent],
  templateUrl: './requests-page.component.html',
  styleUrl: './requests-page.component.scss'
})
export class RequestsPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApiService);
  private readonly requestsApi = inject(RequestsApiService);
  private readonly ui = inject(UiPreferencesService);

  readonly formatCurrency = formatCurrency;

  customers: Customer[] = [];
  requests: CustomerRequest[] = [];
  matchesByRequestId: Record<string, Property[]> = {};
  loading = true;
  error = '';
  matchingRequestId = '';

  readonly form = this.fb.nonNullable.group({
    customerId: ''
  });

  get customerOptions(): UiDropdownOption[] {
    return [
      { value: '', labelKey: 'requests.allCustomers' },
      ...this.customers.map((customer) => ({ value: customer.id, label: customer.name }))
    ];
  }

  constructor() {
    this.form.controls.customerId.valueChanges.subscribe((value) => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { customerId: value || null },
        queryParamsHandling: ''
      });
    });

    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const customerId = params.get('customerId') ?? '';
          this.form.patchValue({ customerId }, { emitEvent: false });
          this.loading = true;
          this.error = '';

          return forkJoin({
            customers: this.customersApi.list(),
            requests: this.requestsApi.list(customerId || undefined)
          });
        })
      )
      .subscribe({
        next: ({ customers, requests }) => {
          this.customers = customers;
          this.requests = requests;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadRequestsFailed');
          this.loading = false;
        }
      });
  }

  customerName(customerId: string): string {
    return this.customers.find((customer) => customer.id === customerId)?.name ?? this.ui.translate('requests.unknownCustomer');
  }

  deleteRequest(id: string): void {
    if (!window.confirm(this.ui.translate('messages.confirmDeleteRequest'))) return;

    this.requestsApi.delete(id).subscribe({
      next: () => {
        this.requests = this.requests.filter((request) => request.id !== id);
        delete this.matchesByRequestId[id];
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }

  findMatches(id: string): void {
    this.matchingRequestId = id;
    this.requestsApi.findMatches(id).subscribe({
      next: (matches) => {
        this.matchesByRequestId[id] = matches;
        this.matchingRequestId = '';
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.findMatchesFailed');
        this.matchingRequestId = '';
      }
    });
  }

  locationSummary(request: CustomerRequest): string {
    return request.preferredLocations
      .map((location) => `${location.city}${location.area ? `, ${location.area}` : ''}`)
      .join(' | ');
  }
}
