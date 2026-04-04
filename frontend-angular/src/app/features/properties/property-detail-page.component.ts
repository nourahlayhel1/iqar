import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { formatCurrency } from '../../core/formatters';
import { Owner, Property } from '../../core/models';
import { OwnersApiService } from '../../core/owners-api.service';
import { PropertiesApiService } from '../../core/properties-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-property-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './property-detail-page.component.html',
  styleUrl: './property-detail-page.component.scss'
})
export class PropertyDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PropertiesApiService);
  private readonly ownersApi = inject(OwnersApiService);
  private readonly ui = inject(UiPreferencesService);

  readonly formatCurrency = formatCurrency;
  property?: Property;
  owner?: Owner;
  loading = true;
  error = '';

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.getById(params.get('id') ?? '')),
        switchMap((property) => {
          this.property = property;
          if (!property.ownerId) {
            return of(null);
          }
          return this.ownersApi.getById(property.ownerId);
        })
      )
      .subscribe({
        next: (owner) => {
          this.owner = owner ?? undefined;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadPropertyFailed');
          this.loading = false;
        }
      });
  }

  deleteProperty(): void {
    if (!this.property || !window.confirm(this.ui.translate('messages.confirmDeleteProperty'))) return;

    this.api.delete(this.property.id).subscribe({
      next: () => void this.router.navigate(['/properties']),
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }
}
