import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  COMMON_AMENITIES,
  PROPERTY_AMENITIES_BY_TYPE,
  PROPERTY_PURPOSES,
  PROPERTY_TYPES,
  PROPERTY_TYPES_WITH_BATHROOMS,
  PROPERTY_TYPES_WITH_BEDROOMS
} from '../../core/constants';
import { formatCurrency } from '../../core/formatters';
import { PropertiesApiService } from '../../core/properties-api.service';
import { Property } from '../../core/models';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../core/ui-dropdown.component';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UiDropdownComponent],
  templateUrl: './properties-page.component.html',
  styleUrl: './properties-page.component.scss'
})
export class PropertiesPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PropertiesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiPreferencesService);

  readonly propertyTypes = PROPERTY_TYPES;
  readonly propertyPurposes = PROPERTY_PURPOSES;
  readonly formatCurrency = formatCurrency;
  readonly sortOptions: UiDropdownOption[] = [
    { value: 'newest', labelKey: 'sort.newest' },
    { value: 'oldest', labelKey: 'sort.oldest' },
    { value: 'priceAsc', labelKey: 'sort.priceAsc' },
    { value: 'priceDesc', labelKey: 'sort.priceDesc' }
  ];
  readonly purposeOptions: UiDropdownOption[] = [
    { value: '', labelKey: 'common.any' },
    ...PROPERTY_PURPOSES.map((purpose) => ({
      value: purpose,
      labelKey: `propertyPurpose.${purpose}`
    }))
  ];
  readonly typeOptions: UiDropdownOption[] = [
    { value: '', labelKey: 'common.any' },
    ...PROPERTY_TYPES.map((type) => ({
      value: type,
      labelKey: `propertyType.${type}`
    }))
  ];

  properties: Property[] = [];
  loading = true;
  error = '';

  readonly filtersForm = this.fb.nonNullable.group({
    q: '',
    city: '',
    purpose: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    sort: 'newest',
    types: this.fb.nonNullable.control<string[]>([]),
    amenities: this.fb.nonNullable.control<string[]>([])
  });

  readonly typeFilterControl = this.fb.nonNullable.control('');

  constructor() {
    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        startWith(this.route.snapshot.queryParamMap)
      )
      .subscribe((params) => {
        this.filtersForm.patchValue(
          {
            q: params.get('q') ?? '',
            city: params.get('city') ?? '',
            purpose: params.get('purpose') ?? '',
            minPrice: params.get('minPrice') ?? '',
            maxPrice: params.get('maxPrice') ?? '',
            minBedrooms: params.get('minBedrooms') ?? '',
            sort: (params.get('sort') as 'newest' | 'oldest' | 'priceAsc' | 'priceDesc') ?? 'newest',
            types: params.getAll('types'),
            amenities: params.getAll('amenities')
          },
          { emitEvent: false }
        );
        this.typeFilterControl.setValue(params.getAll('types')[0] ?? '', { emitEvent: false });
      });

    this.typeFilterControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), distinctUntilChanged())
      .subscribe((type) => {
        this.filtersForm.controls.types.setValue(type ? [type] : []);
        this.filtersForm.controls.amenities.setValue(
          this.filtersForm.controls.amenities.value.filter((amenity) => this.amenities.includes(amenity))
        );
      });

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250), distinctUntilChanged())
      .subscribe((value) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            q: value.q || null,
            city: value.city || null,
            purpose: value.purpose || null,
            minPrice: value.minPrice || null,
            maxPrice: value.maxPrice || null,
            minBedrooms: value.minBedrooms || null,
            sort: value.sort || null,
            types: value.types?.length ? value.types : null,
            amenities: value.amenities?.length ? value.amenities : null
          },
          queryParamsHandling: ''
        });
      });

    this.route.queryParamMap
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((params) => {
          this.loading = true;
          this.error = '';

          return this.api.list({
            q: params.get('q') ?? undefined,
            city: params.get('city') ?? undefined,
            purpose: params.get('purpose') ?? undefined,
            minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
            maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
            minBedrooms: params.get('minBedrooms') ? Number(params.get('minBedrooms')) : undefined,
            sort: (params.get('sort') as 'newest' | 'oldest' | 'priceAsc' | 'priceDesc') ?? 'newest',
            types: params.getAll('types'),
            amenities: params.getAll('amenities')
          });
        })
      )
      .subscribe({
        next: (properties) => {
          this.properties = properties;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadPropertiesFailed');
          this.loading = false;
        }
      });
  }

  toggleMultiSelect(controlName: 'types' | 'amenities', value: string, checked: boolean): void {
    const control = this.filtersForm.controls[controlName];
    const next = new Set(control.value);
    if (checked) next.add(value);
    else next.delete(value);
    control.setValue([...next]);
  }

  get amenities(): string[] {
    const selectedType = this.typeFilterControl.value as Property['type'] | '';
    return selectedType ? PROPERTY_AMENITIES_BY_TYPE[selectedType] ?? COMMON_AMENITIES : COMMON_AMENITIES;
  }

  showBedrooms(property: Property): boolean {
    return PROPERTY_TYPES_WITH_BEDROOMS.includes(property.type) && property.bedrooms !== undefined;
  }

  showBathrooms(property: Property): boolean {
    return PROPERTY_TYPES_WITH_BATHROOMS.includes(property.type) && property.bathrooms !== undefined;
  }

  deleteProperty(id: string): void {
    if (!window.confirm(this.ui.translate('messages.confirmDeleteProperty'))) return;

    this.api.delete(id).subscribe({
      next: () => {
        this.properties = this.properties.filter((property) => property.id !== id);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      city: '',
      purpose: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      sort: 'newest',
      types: [],
      amenities: []
    });
  }
}
