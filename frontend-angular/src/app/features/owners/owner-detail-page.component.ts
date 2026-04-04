import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { formatCurrency } from '../../core/formatters';
import { Owner, Property } from '../../core/models';
import { OwnersApiService } from '../../core/owners-api.service';
import { PropertiesApiService } from '../../core/properties-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-owner-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './owner-detail-page.component.html',
  styleUrl: './owner-detail-page.component.scss'
})
export class OwnerDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(OwnersApiService);
  private readonly propertiesApi = inject(PropertiesApiService);
  private readonly ui = inject(UiPreferencesService);

  readonly formatCurrency = formatCurrency;
  owner?: Owner;
  properties: Property[] = [];
  loading = true;
  error = '';

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => this.api.getById(params.get('id') ?? '')),
        switchMap((owner) => {
          this.owner = owner;
          return this.propertiesApi.list();
        })
      )
      .subscribe({
        next: (properties) => {
          this.properties = properties.filter((property) => property.ownerId === this.owner?.id);
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadOwnerFailed');
          this.loading = false;
        }
      });
  }

  deleteOwner(): void {
    if (!this.owner || !window.confirm(this.ui.translate('messages.confirmDeleteOwner'))) return;

    this.api.delete(this.owner.id).subscribe({
      next: () => void this.router.navigate(['/owners']),
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }
}
