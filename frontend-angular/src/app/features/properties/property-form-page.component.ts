import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe, UiDropdownComponent],
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
  readonly existingContactMode = 'existing';
  readonly newContactMode = 'new';
  private readonly maxImageUploadBytes = 650_000;
  private readonly maxSingleImageRequestBytes = 2_000_000;

  owners: Owner[] = [];
  ownerOptions: UiDropdownOption[] = [{ value: '', label: 'N/A' }];
  contactModeOptions: UiDropdownOption[] = [{ value: 'new', labelKey: 'propertyForm.createNewContact' }];
  contactMode: 'existing' | 'new' = 'new';
  mode: 'create' | 'edit' = 'create';
  propertyId = '';
  selectedImages: File[] = [];
  selectedImagePreviews: Array<{ fileName: string; previewUrl: string }> = [];
  selectedCoverImageIndex = -1;
  existingImages: string[] = [];
  coverImage = '';
  loading = false;
  error = '';
  priceDisplay = '0';

  readonly form = this.fb.nonNullable.group({
    title: [''],
    description: [''],
    type: ['apartment' as Property['type']],
    purpose: ['sale' as Property['purpose']],
    source: ['direct_owner' as NonNullable<Property['source']>],
    price: [0, [Validators.min(0)]],
    propertyNumber: [null as number | null],
    lotNumber: [null as number | null],
    location: this.fb.nonNullable.group({
      city: [''],
      area: [''],
      address: ['']
    }),
    bedrooms: [null as number | null],
    bathrooms: [null as number | null],
    areaSqm: [null as number | null],
    floor: [null as number | null],
    parking: [false],
    furnished: [false],
    amenitiesText: [''],
    ownerId: [''],
    ownerName: [''],
    ownerPhone: ['']
  });

  constructor() {
    this.form.controls.type.valueChanges.subscribe((type) => {
      this.applyPropertyTypeRules(type);
    });

    this.form.controls.ownerId.valueChanges.subscribe((ownerId) => {
      if (this.contactMode !== 'existing') {
        return;
      }

      const owner = this.owners.find((entry) => entry.id === ownerId);
      this.form.patchValue(
        {
          ownerName: owner?.name ?? '',
          ownerPhone: owner?.phone ?? ''
        },
        { emitEvent: false }
      );
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

        this.contactModeOptions = owners.length
          ? [
              { value: this.existingContactMode, labelKey: 'propertyForm.selectExistingContact' },
              { value: this.newContactMode, labelKey: 'propertyForm.createNewContact' }
            ]
          : [{ value: this.newContactMode, labelKey: 'propertyForm.createNewContact' }];

        if (this.mode === 'create') {
          if (owners.length) {
            this.setContactMode('existing');
            this.form.patchValue({ ownerId: owners[0].id }, { emitEvent: true });
          } else {
            this.setContactMode('new');
          }
        } else if (this.contactMode === 'existing' && this.form.controls.ownerId.value) {
          const selectedOwner = owners.find((entry) => entry.id === this.form.controls.ownerId.value);
          this.form.patchValue(
            {
              ownerName: selectedOwner?.name ?? this.form.controls.ownerName.value,
              ownerPhone: selectedOwner?.phone ?? this.form.controls.ownerPhone.value
            },
            { emitEvent: false }
          );
        }
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
              propertyNumber: property.propertyNumber ?? null,
              lotNumber: property.lotNumber ?? null,
              location: {
                city: property.location.city,
                area: property.location.area ?? '',
                address: property.location.address ?? ''
              },
              bedrooms: property.bedrooms ?? null,
              bathrooms: property.bathrooms ?? null,
              areaSqm: property.areaSqm ?? null,
              floor: property.floor ?? null,
              parking: property.parking ?? false,
              furnished: property.furnished ?? false,
              amenitiesText: [...amenities].join(', '),
              ownerId: property.ownerId ?? '',
              ownerName: property.ownerName ?? '',
              ownerPhone: property.ownerPhone ?? ''
            });
            this.priceDisplay = this.formatPrice(property.price);
            this.setContactMode(property.ownerId ? 'existing' : 'new');
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
      title: value.title.trim(),
      description: value.description.trim(),
      type: value.type,
      purpose: value.purpose,
      source: value.source,
      price: Number(value.price),
      propertyNumber: value.propertyNumber ?? undefined,
      lotNumber: value.type === 'apartment' ? value.lotNumber ?? undefined : undefined,
      currency: 'USD' as Property['currency'],
      location: {
        city: value.location.city.trim(),
        area: value.location.area.trim() || undefined,
        address: value.location.address.trim() || undefined
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
      ownerId: this.contactMode === 'existing' ? value.ownerId || undefined : undefined,
      ownerName: this.contactMode === 'new' ? value.ownerName.trim() || undefined : value.ownerName || undefined,
      ownerPhone: this.contactMode === 'new' ? value.ownerPhone.trim() || undefined : value.ownerPhone || undefined
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

  updatePrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = this.parsePrice(input.value);
    this.form.controls.price.setValue(numericValue, { emitEvent: false });
    this.priceDisplay = input.value.trim() ? this.formatPrice(numericValue) : '';
    input.value = this.priceDisplay;
  }

  moveToNextField(keyboardEvent: KeyboardEvent): void {
    if (!['Enter', 'ArrowRight', 'ArrowLeft', 'Next'].includes(keyboardEvent.key)) {
      return;
    }

    const target = keyboardEvent.target as HTMLElement | null;

    if (!target || target instanceof HTMLTextAreaElement) {
      return;
    }

    const isDropdownTrigger = target instanceof HTMLButtonElement && target.classList.contains('dropdown-trigger');
    if (target instanceof HTMLButtonElement && (!isDropdownTrigger || keyboardEvent.key === 'Enter')) {
      return;
    }

    if (target instanceof HTMLInputElement && ['checkbox', 'file', 'radio', 'submit', 'button'].includes(target.type)) {
      return;
    }

    const form = target.closest('form');
    if (!form) {
      return;
    }

    const focusable = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, button, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => {
      const control = element as HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement;
      return !control.disabled && !element.hasAttribute('hidden') && element.offsetParent !== null;
    });

    const currentIndex = focusable.indexOf(target);
    const nextField = keyboardEvent.key === 'ArrowLeft' ? focusable[currentIndex - 1] : focusable[currentIndex + 1];
    if (!nextField) {
      return;
    }

    keyboardEvent.preventDefault();
    nextField.focus();
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

  get showLotNumber(): boolean {
    return this.form.controls.type.value === 'apartment';
  }

  get showFurnished(): boolean {
    return this.supportsFurnished(this.form.controls.type.value);
  }

  get isExistingContactMode(): boolean {
    return this.contactMode === 'existing';
  }

  get contactNameLabel(): string {
    return this.form.controls.source.value === 'broker'
      ? this.ui.translate('propertyForm.brokerName')
      : this.ui.translate('fields.ownerName');
  }

  get contactPhoneLabel(): string {
    return this.form.controls.source.value === 'broker'
      ? this.ui.translate('propertyForm.brokerPhone')
      : this.ui.translate('fields.ownerPhone');
  }

  get contactModeLabel(): string {
    return this.form.controls.source.value === 'broker'
      ? this.ui.translate('propertyForm.brokerSource')
      : this.ui.translate('propertyForm.ownerSource');
  }

  setContactMode(mode: 'existing' | 'new'): void {
    this.contactMode = mode;

    if (mode === 'existing') {
      const selectedOwner = this.owners.find((entry) => entry.id === this.form.controls.ownerId.value) ?? this.owners[0];
      this.form.patchValue(
        {
          ownerId: selectedOwner?.id ?? '',
          ownerName: selectedOwner?.name ?? '',
          ownerPhone: selectedOwner?.phone ?? ''
        },
        { emitEvent: false }
      );
      return;
    }

    this.form.patchValue(
      {
        ownerId: '',
        ownerName: '',
        ownerPhone: ''
      },
      { emitEvent: false }
    );
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
    if (type !== 'apartment') {
      this.form.controls.lotNumber.setValue(null);
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

  private parsePrice(value: string): number {
    const normalized = value.replace(/,/g, '').replace(/[^\d.]/g, '');
    const parts = normalized.split('.');
    const price = Number(parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : normalized);
    return Number.isFinite(price) ? price : 0;
  }

  private formatPrice(value: number): string {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(value);
  }

  async chooseImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const resizedImages = await Promise.all(Array.from(input.files ?? []).map((image) => this.resizeImageForUpload(image)));
    const acceptedImages: File[] = [];

    for (const image of resizedImages) {
      if (image.size > this.maxSingleImageRequestBytes) {
        this.error = 'One or more images are still too large after compression. Please choose a smaller image.';
        continue;
      }

      acceptedImages.push(image);
    }

    if (!acceptedImages.length) {
      input.value = '';
      return;
    }

    if (acceptedImages.length && resizedImages.some((image, index) => image.size < (input.files?.[index]?.size ?? image.size))) {
      this.error = '';
    }

    const newPreviews = acceptedImages.map((image) => ({
      fileName: image.name,
      previewUrl: URL.createObjectURL(image)
    }));
    this.selectedImages = [...this.selectedImages, ...acceptedImages];
    this.selectedImagePreviews = [...this.selectedImagePreviews, ...newPreviews];
    if (!this.coverImage && this.selectedCoverImageIndex < 0 && this.selectedImages.length) {
      this.selectedCoverImageIndex = 0;
    }
    input.value = '';
  }

  private async resizeImageForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return file;
    }

    const maxDimension = 1400;
    const imageUrl = URL.createObjectURL(file);

    try {
      const image = new Image();
      image.src = imageUrl;
      await image.decode();

      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      if (scale === 1 && file.size <= this.maxImageUploadBytes) {
        return file;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        return file;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await this.canvasToSizedJpeg(canvas);
      if (!blob || blob.size >= file.size) {
        return file;
      }

      const resizedName = file.name.replace(/\.[^.]+$/, '') || 'property-image';
      return new File([blob], `${resizedName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
    } catch {
      return file;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  private async canvasToSizedJpeg(canvas: HTMLCanvasElement): Promise<Blob | null> {
    const qualities = [0.78, 0.7, 0.62, 0.54];
    let smallestBlob: Blob | null = null;

    for (const quality of qualities) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) {
        continue;
      }

      smallestBlob = !smallestBlob || blob.size < smallestBlob.size ? blob : smallestBlob;
      if (blob.size <= this.maxImageUploadBytes) {
        return blob;
      }
    }

    return smallestBlob;
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
