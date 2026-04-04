import { Pipe, PipeTransform, inject } from '@angular/core';
import { UiPreferencesService } from './ui-preferences.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly ui = inject(UiPreferencesService);

  transform(key: string): string {
    return this.ui.translate(key);
  }
}
