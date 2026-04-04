import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';
import { COMMON_AMENITIES, PROPERTY_PURPOSES, PROPERTY_TYPES } from '../../core/constants';
import { CustomersApiService } from '../../core/customers-api.service';
import { RequestsApiService } from '../../core/requests-api.service';
import { Customer, CustomerRequest } from '../../core/models';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../core/ui-dropdown.component';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-request-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, UiDropdownComponent],
  templateUrl: './request-form-page.component.html',
  styleUrl: './request-form-page.component.scss'
})
export class RequestFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly customersApi = inject(CustomersApiService);
  private readonly requestsApi = inject(RequestsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiPreferencesService);

  readonly propertyTypes = PROPERTY_TYPES;
  readonly propertyPurposes = PROPERTY_PURPOSES;
  readonly commonAmenities = COMMON_AMENITIES;
  readonly typeOptions: UiDropdownOption[] = PROPERTY_TYPES.map((type) => ({
    value: type,
    labelKey: `propertyType.${type}`
  }));
  readonly purposeOptions: UiDropdownOption[] = PROPERTY_PURPOSES.map((purpose) => ({
    value: purpose,
    labelKey: `propertyPurpose.${purpose}`
  }));

  customers: Customer[] = [];
  mode: 'create' | 'edit' = 'create';
  requestId = '';
  presetCustomerId = '';
  loading = true;
  error = '';

  readonly form = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    requestType: ['apartment' as CustomerRequest['requestType'], Validators.required],
    purpose: ['sale' as CustomerRequest['purpose'], Validators.required],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    minBedrooms: [null as number | null],
    minBathrooms: [null as number | null],
    minAreaSqm: [null as number | null],
    mustHaveAmenitiesText: [''],
    notes: [''],
    preferredLocations: this.fb.array([this.createLocationGroup()])
  });

  get customerOptions(): UiDropdownOption[] {
    return this.customers.map((customer) => ({ value: customer.id, label: customer.name }));
  }

  get preferredLocations(): FormArray {
    return this.form.controls.preferredLocations;
  }

  constructor() {
    this.presetCustomerId = this.route.snapshot.queryParamMap.get('customerId') ?? '';

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.mode = 'create';
            return forkJoin({
              customers: this.customersApi.list(),
              request: of(null)
            });
          }

          this.mode = 'edit';
          this.requestId = id;
          return forkJoin({
            customers: this.customersApi.list(),
            request: this.requestsApi.getById(id)
          });
        })
      )
      .subscribe({
        next: ({ customers, request }) => {
          this.customers = customers;

          if (request) {
            this.preferredLocations.clear();
            request.preferredLocations.forEach((location) => {
              this.preferredLocations.push(
                this.fb.nonNullable.group({
                  city: [location.city, Validators.required],
                  area: [location.area ?? '']
                })
              );
            });

            this.form.patchValue({
              customerId: request.customerId,
              requestType: request.requestType,
              purpose: request.purpose,
              minPrice: request.minPrice ?? null,
              maxPrice: request.maxPrice ?? null,
              minBedrooms: request.minBedrooms ?? null,
              minBathrooms: request.minBathrooms ?? null,
              minAreaSqm: request.minAreaSqm ?? null,
              mustHaveAmenitiesText: (request.mustHaveAmenities ?? []).join(', '),
              notes: request.notes ?? ''
            });
          } else {
            this.form.patchValue({
              customerId: this.presetCustomerId || customers[0]?.id || ''
            });
          }

          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadRequestFormFailed');
          this.loading = false;
        }
      });
  }

  createLocationGroup() {
    return this.fb.nonNullable.group({
      city: ['', Validators.required],
      area: ['']
    });
  }

  addLocation(): void {
    this.preferredLocations.push(this.createLocationGroup());
  }

  removeLocation(index: number): void {
    if (this.preferredLocations.length === 1) return;
    this.preferredLocations.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const value = this.form.getRawValue();
    const payload = {
      customerId: value.customerId,
      requestType: value.requestType,
      purpose: value.purpose,
      preferredLocations: value.preferredLocations.map((location) => ({
        city: location.city,
        area: location.area || undefined
      })),
      minPrice: value.minPrice ?? undefined,
      maxPrice: value.maxPrice ?? undefined,
      minBedrooms: value.minBedrooms ?? undefined,
      minBathrooms: value.minBathrooms ?? undefined,
      minAreaSqm: value.minAreaSqm ?? undefined,
      mustHaveAmenities: value.mustHaveAmenitiesText.split(',').map((item) => item.trim()).filter(Boolean),
      notes: value.notes || undefined
    };

    const request$ = this.mode === 'create' ? this.requestsApi.create(payload) : this.requestsApi.update(this.requestId, payload);
    request$.subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigate(this.presetCustomerId ? ['/customers', this.presetCustomerId] : ['/requests']);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.saveRequestFailed');
        this.loading = false;
      }
    });
  }

  toggleAmenity(amenity: string, checked: boolean): void {
    const current = this.form.controls.mustHaveAmenitiesText.value.split(',').map((item) => item.trim()).filter(Boolean);
    const next = new Set(current);
    if (checked) next.add(amenity);
    else next.delete(amenity);
    this.form.controls.mustHaveAmenitiesText.setValue([...next].join(', '));
  }

  hasAmenity(amenity: string): boolean {
    return this.form.controls.mustHaveAmenitiesText.value.split(',').map((item) => item.trim()).filter(Boolean).includes(amenity);
  }
}
