import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Owner } from '../../core/models';
import { OwnersApiService } from '../../core/owners-api.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { UiPreferencesService } from '../../core/ui-preferences.service';

@Component({
  selector: 'app-owners-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './owners-page.component.html',
  styleUrl: './owners-page.component.scss'
})
export class OwnersPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(OwnersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ui = inject(UiPreferencesService);

  owners: Owner[] = [];
  loading = true;
  error = '';

  readonly form = this.fb.nonNullable.group({ q: '' });

  constructor() {
    this.form.patchValue({ q: this.route.snapshot.queryParamMap.get('q') ?? '' }, { emitEvent: false });

    this.form.controls.q.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250))
      .subscribe((q) => {
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: q || null },
          queryParamsHandling: ''
        });
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef), switchMap((params) => this.api.list(params.get('q') ?? undefined)))
      .subscribe({
        next: (owners) => {
          this.owners = owners;
          this.loading = false;
        },
        error: (error: { error?: { error?: string } }) => {
          this.error = error.error?.error ?? this.ui.translate('messages.loadOwnersFailed');
          this.loading = false;
        }
      });
  }

  deleteOwner(id: string): void {
    if (!window.confirm(this.ui.translate('messages.confirmDeleteOwner'))) return;

    this.api.delete(id).subscribe({
      next: () => {
        this.owners = this.owners.filter((owner) => owner.id !== id);
      },
      error: (error: { error?: { error?: string } }) => {
        this.error = error.error?.error ?? this.ui.translate('messages.deleteFailed');
      }
    });
  }
}
