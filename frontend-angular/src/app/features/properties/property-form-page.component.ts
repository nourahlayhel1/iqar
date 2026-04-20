import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, of, switchMap, timeout } from 'rxjs';
import {
  COMMON_AMENITIES,
  PROPERTY_AMENITIES_BY_TYPE,
  PROPERTY_PURPOSES,
  PROPERTY_SOURCES,
  PROPERTY_TYPES,
  PROPERTY_TYPES_WITH_BATHROOMS,
  PROPERTY_TYPES_WITH_BEDROOMS
} from '../../core/constants';
import { Owner, Property } from '../../core/models';
import { OwnersApiService } from '../../core/owners-api.service';
import { PropertiesApiService } from '../../core/properties-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiDropdownComponent, UiDropdownOption } from '../../core/ui-dropdown.component';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-property-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, UiDropdownComponent],
  templateUrl: './property-form-page.component.html',
  styleUrl: './property-form-page.component.scss'
})
export class PropertyFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PropertiesApiService);
  private readonly ownersApi = inject(OwnersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiPreferencesService);

  readonly propertyTypes = PROPERTY_TYPES;
  readonly propertyPurposes = PROPERTY_PURPOSES;
  readonly typeOptions: UiDropdownOption[] = PROPERTY_TYPES.map((type) => ({
    value: type,
    labelKey: `propertyType.${type}`
  }));
  readonly purposeOptions: UiDropdownOption[] = PROPERTY_PURPOSES.map((purpose) => ({
    value: purpose,
    labelKey: `propertyPurpose.${purpose}`
  }));
  readonly sourceOptions: UiDropdownOption[] = PROPERTY_SOURCES.map((source) => ({
    value: source,
    labelKey: `propertySource.${source}`
  }));

  owners: Owner[] = [];
  ownerOptions: UiDropdownOption[] = [{ value: '', label: 'N/A' }];
  mode: 'create' | 'edit' = 'create';
  propertyId = '';
  selectedImages: File[] = [];
  selectedImagePreviews: Array<{ fileName: string; previewUrl: string }> = [];
  selectedCoverImageIndex = -1;
  existingImages: string[] = [];
  coverImage = '';
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    type: ['apartment' as Property['type'], Validators.required],
    purpose: ['sale' as Property['purpose'], Validators.required],
    source: ['direct_owner' as NonNullable<Property['source']>, Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    location: this.fb.nonNullable.group({
      city: ['', Validators.required]
    }),
    bedrooms: [null as number | null],
    bathrooms: [null as number | null],
    areaSqm: [null as number | null],
    floor: [null as number | null],
    parking: [false],
    furnished: [false],
    amenitiesText: [''],
    ownerId: ['']
  });

  constructor() {
    this.form.controls.type.valueChanges.subscribe((type) => {
      this.applyPropertyTypeRules(type);
    });

    this.ownersApi.list().subscribe({
      next: (owners) => {
        this.owners = owners;
        this.ownerOptions = [
          { value: '', label: 'N/A' },
          ...owners.map((owner) => ({
            value: owner.id,
            label: `${owner.name} - ${owner.phone}`
          }))
        ];
      }
    });

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) {
            this.mode = 'create';
            return of(null);
          }

          this.mode = 'edit';
          this.propertyId = id;
          this.loading = true;
          return this.api.getById(id);
        })
      )
      .subscribe({
        next: (property) => {
          if (property) {
            const amenities = new Set(property.amenities);
            if (property.parking) amenities.add('parking');
            if (property.furnished) amenities.add('furnished');
            this.form.patchValue({
              title: property.title,
              description: property.description,
              type: property.type,
              purpose: property.purpose,
              source: property.source ?? 'direct_owner',
              price: property.price,
              location: {
                city: property.location.city
              },
              bedrooms: property.bedrooms ?? null,
              bathrooms: property.bathrooms ?? null,
              areaSqm: property.areaSqm ?? null,
              floor: property.floor ?? null,
              parking: property.parking ?? false,
              furnished: property.furnished ?? false,
              amenitiesText: [...amenities].join(', '),
              ownerId: property.ownerId ?? ''
            });
            this.applyPropertyTypeRules(property.type);
            this.existingImages = property.images;
            this.coverImage = property.coverImage || property.images[0] || '';
          }
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadPropertyFailed');
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
    const value = this.form.getRawValue();
    const amenities = value.amenitiesText
      .split(',')
      .map((item) => item.trim())
      .filter((amenity) => this.availableAmenities.includes(amenity));
    const payload = {
      title: value.title,
      description: value.description,
      type: value.type,
      purpose: value.purpose,
      source: value.source,
      price: Number(value.price),
      currency: 'USD' as Property['currency'],
      location: {
        city: value.location.city
      },
      bedrooms: this.supportsBedrooms(value.type) ? value.bedrooms ?? undefined : undefined,
      bathrooms: this.supportsBathrooms(value.type) ? value.bathrooms ?? undefined : undefined,
      areaSqm: value.areaSqm ?? undefined,
      floor: this.supportsFloor(value.type) ? value.floor ?? undefined : undefined,
      parking: value.parking,
      furnished: this.supportsFurnished(value.type) ? value.furnished : false,
      amenities,
      coverImage: this.coverImage || undefined,
      images: this.existingImages,
      ownerId: value.ownerId || undefined
    };

    const request$ = this.mode === 'create'
      ? this.api.create(payload, this.selectedImages, this.selectedCoverImageIndex)
      : this.api.update(this.propertyId, payload, this.selectedImages, this.selectedCoverImageIndex);
    request$
      .pipe(
        timeout(60000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
      next: (property) => {
        void this.router.navigate(['/properties', property.id]);
      },
      error: (error: { name?: string; error?: { error?: string } }) => {
        this.error =
          error.name === 'TimeoutError'
            ? 'Saving took too long. Please try again with smaller images or fewer files.'
            : error.error?.error ?? this.ui.translate('messages.savePropertyFailed');
      }
    });
  }

  addAmenity(amenity: string, checked: boolean): void {
    const current = this.form.controls.amenitiesText.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const next = new Set(current);
    if (checked) next.add(amenity);
    else next.delete(amenity);
    this.form.controls.amenitiesText.setValue([...next].join(', '));

    if (amenity === 'parking') {
      this.form.controls.parking.setValue(checked);
    }
    if (amenity === 'furnished') {
      this.form.controls.furnished.setValue(checked);
    }
  }

  hasAmenity(amenity: string): boolean {
    return this.form.controls.amenitiesText.value.split(',').map((item) => item.trim()).filter(Boolean).includes(amenity);
  }

  get availableAmenities(): string[] {
    return PROPERTY_AMENITIES_BY_TYPE[this.form.controls.type.value] ?? COMMON_AMENITIES;
  }

  get showBedrooms(): boolean {
    return this.supportsBedrooms(this.form.controls.type.value);
  }

  get showBathrooms(): boolean {
    return this.supportsBathrooms(this.form.controls.type.value);
  }

  get showFloor(): boolean {
    return this.supportsFloor(this.form.controls.type.value);
  }

  get showFurnished(): boolean {
    return this.supportsFurnished(this.form.controls.type.value);
  }

  private applyPropertyTypeRules(type: Property['type']): void {
    if (!this.supportsBedrooms(type)) {
      this.form.controls.bedrooms.setValue(null);
    }
    if (!this.supportsBathrooms(type)) {
      this.form.controls.bathrooms.setValue(null);
    }
    if (!this.supportsFloor(type)) {
      this.form.controls.floor.setValue(null);
    }
    if (!this.supportsFurnished(type)) {
      this.form.controls.furnished.setValue(false);
    }

    const allowedAmenities = new Set(PROPERTY_AMENITIES_BY_TYPE[type] ?? COMMON_AMENITIES);
    if (!allowedAmenities.has('parking')) {
      this.form.controls.parking.setValue(false);
    }
    const nextAmenities = this.form.controls.amenitiesText.value
      .split(',')
      .map((item) => item.trim())
      .filter((amenity) => amenity && allowedAmenities.has(amenity));
    this.form.controls.amenitiesText.setValue([...new Set(nextAmenities)].join(', '), { emitEvent: false });
  }

  private supportsBedrooms(type: Property['type']): boolean {
    return PROPERTY_TYPES_WITH_BEDROOMS.includes(type);
  }

  private supportsBathrooms(type: Property['type']): boolean {
    return PROPERTY_TYPES_WITH_BATHROOMS.includes(type);
  }

  private supportsFloor(type: Property['type']): boolean {
    return type !== 'land';
  }

  private supportsFurnished(type: Property['type']): boolean {
    return type !== 'land';
  }

  chooseImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newImages = Array.from(input.files ?? []);
    const newPreviews = newImages.map((image) => ({
      fileName: image.name,
      previewUrl: URL.createObjectURL(image)
    }));
    this.selectedImages = [...this.selectedImages, ...newImages];
    this.selectedImagePreviews = [...this.selectedImagePreviews, ...newPreviews];
    if (!this.coverImage && this.selectedCoverImageIndex < 0 && this.selectedImages.length) {
      this.selectedCoverImageIndex = 0;
    }
    input.value = '';
  }

  removeExistingImage(image: string): void {
    this.existingImages = this.existingImages.filter((entry) => entry !== image);
    if (this.coverImage === image) {
      this.coverImage = this.existingImages[0] || '';
      if (!this.coverImage && this.selectedImages.length) {
        this.selectedCoverImageIndex = 0;
      }
    }
  }

  setExistingCover(image: string): void {
    this.coverImage = image;
    this.selectedCoverImageIndex = -1;
  }

  setSelectedCover(index: number): void {
    this.selectedCoverImageIndex = index;
    this.coverImage = '';
  }

  removeSelectedImage(index: number): void {
    const [removedPreview] = this.selectedImagePreviews.splice(index, 1);
    if (removedPreview) URL.revokeObjectURL(removedPreview.previewUrl);
    this.selectedImages.splice(index, 1);
    this.selectedImages = [...this.selectedImages];
    this.selectedImagePreviews = [...this.selectedImagePreviews];

    if (this.selectedCoverImageIndex === index) {
      this.selectedCoverImageIndex = this.selectedImages.length ? 0 : -1;
      if (this.selectedCoverImageIndex < 0) {
        this.coverImage = this.existingImages[0] || '';
      }
      return;
    }

    if (this.selectedCoverImageIndex > index) {
      this.selectedCoverImageIndex -= 1;
    }
  }
}
