import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { Customer, CustomerRequest } from '../../core/models';
import { CustomersApiService } from '../../core/customers-api.service';
import { RequestsApiService } from '../../core/requests-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-customer-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './customer-detail-page.component.html',
  styleUrl: './customer-detail-page.component.scss'
})
export class CustomerDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly customersApi = inject(CustomersApiService);
  private readonly requestsApi = inject(RequestsApiService);
  private readonly ui = inject(UiPreferencesService);

  customer?: Customer;
  requests: CustomerRequest[] = [];
  loading = true;
  error = '';

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id') ?? '';
          return forkJoin({
            customer: this.customersApi.getById(id),
            requests: this.requestsApi.list(id)
          });
        })
      )
      .subscribe({
        next: ({ customer, requests }) => {
          this.customer = customer;
          this.requests = requests;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadCustomerFailed');
          this.loading = false;
        }
      });
  }

  deleteCustomer(): void {
    if (!this.customer || !window.confirm(this.ui.translate('messages.confirmDeleteCustomer'))) return;

    this.customersApi.delete(this.customer.id).subscribe({
      next: () => void this.router.navigate(['/customers']),
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }

  requestCities(request: CustomerRequest): string {
    return request.preferredLocations.map((location) => location.city).join(', ');
  }
}
