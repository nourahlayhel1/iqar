import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { COMMON_AMENITIES, PROPERTY_PURPOSES, PROPERTY_TYPES } from '../../core/constants';
import { formatCurrency } from '../../core/formatters';
import { PropertyExcelService } from '../../core/property-excel.service';
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
  private readonly excel = inject(PropertyExcelService);

  readonly propertyTypes = PROPERTY_TYPES;
  readonly propertyPurposes = PROPERTY_PURPOSES;
  readonly amenities = COMMON_AMENITIES;
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
  importing = false;
  error = '';
  importStatus = '';

  readonly filtersForm = this.fb.nonNullable.group({
    q: '',
    country: '',
    city: '',
    area: '',
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
            country: params.get('country') ?? '',
            city: params.get('city') ?? '',
            area: params.get('area') ?? '',
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
      });

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250), distinctUntilChanged())
      .subscribe((value) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            q: value.q || null,
            country: value.country || null,
            city: value.city || null,
            area: value.area || null,
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
            country: params.get('country') ?? undefined,
            city: params.get('city') ?? undefined,
            area: params.get('area') ?? undefined,
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

  async downloadExcelTemplate(): Promise<void> {
    this.error = '';
    await this.excel.downloadTemplate();
  }

  async importExcelFile(file: File | null): Promise<void> {
    if (!file) {
      return;
    }

    this.importing = true;
    this.error = '';
    this.importStatus = '';

    try {
      const result = await this.excel.importFile(file);
      this.importStatus = `${this.ui.translate('properties.importedCount')} ${result.importedCount}`;
      if (result.errors.length) {
        this.error = result.errors.slice(0, 8).join('\n');
      }

      this.api
        .list({
          q: this.filtersForm.controls.q.value || undefined,
          country: this.filtersForm.controls.country.value || undefined,
          city: this.filtersForm.controls.city.value || undefined,
          area: this.filtersForm.controls.area.value || undefined,
          purpose: this.filtersForm.controls.purpose.value || undefined,
          minPrice: this.filtersForm.controls.minPrice.value ? Number(this.filtersForm.controls.minPrice.value) : undefined,
          maxPrice: this.filtersForm.controls.maxPrice.value ? Number(this.filtersForm.controls.maxPrice.value) : undefined,
          minBedrooms: this.filtersForm.controls.minBedrooms.value
            ? Number(this.filtersForm.controls.minBedrooms.value)
            : undefined,
          sort: this.filtersForm.controls.sort.value as 'newest' | 'oldest' | 'priceAsc' | 'priceDesc',
          types: this.filtersForm.controls.types.value,
          amenities: this.filtersForm.controls.amenities.value
        })
        .subscribe((properties) => {
          this.properties = properties;
        });
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.importing = false;
    }
  }

  clearFilters(): void {
    this.filtersForm.reset({
      q: '',
      country: '',
      city: '',
      area: '',
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
