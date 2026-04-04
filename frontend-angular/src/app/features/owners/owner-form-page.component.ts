import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { OwnersApiService } from '../../core/owners-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-owner-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './owner-form-page.component.html',
  styleUrl: './owner-form-page.component.scss'
})
export class OwnerFormPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OwnersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ui = inject(UiPreferencesService);

  mode: 'create' | 'edit' = 'create';
  ownerId = '';
  loading = false;
  error = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    altPhone: [''],
    notes: [''],
    documents: this.fb.array([this.createDocumentGroup()])
  });

  get documents(): FormArray {
    return this.form.controls.documents;
  }

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return of(null);

          this.mode = 'edit';
          this.ownerId = id;
          this.loading = true;
          return this.api.getById(id);
        })
      )
      .subscribe({
        next: (owner) => {
          if (owner) {
            this.documents.clear();
            const docs = owner.documents.length ? owner.documents : [{ name: '', url: '' }];
            docs.forEach((document) => {
              this.documents.push(
                this.fb.nonNullable.group({
                  name: [document.name],
                  url: [document.url]
                })
              );
            });
            this.form.patchValue({
              name: owner.name,
              phone: owner.phone,
              altPhone: owner.altPhone ?? '',
              notes: owner.notes ?? ''
            });
          }
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadOwnerFailed');
          this.loading = false;
        }
      });
  }

  createDocumentGroup() {
    return this.fb.nonNullable.group({ name: [''], url: [''] });
  }

  addDocument(): void {
    this.documents.push(this.createDocumentGroup());
  }

  removeDocument(index: number): void {
    if (this.documents.length === 1) {
      this.documents.at(0).reset();
      return;
    }
    this.documents.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      name: value.name,
      phone: value.phone,
      altPhone: value.altPhone || undefined,
      notes: value.notes || undefined,
      documents: value.documents.filter((document) => document.name.trim() && document.url.trim())
    };

    this.loading = true;
    this.error = '';
    const request$ = this.mode === 'create' ? this.api.create(payload) : this.api.update(this.ownerId, payload);
    request$.subscribe({
      next: (owner) => {
        this.loading = false;
        void this.router.navigate(['/owners', owner.id]);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.saveOwnerFailed');
        this.loading = false;
      }
    });
  }
}
