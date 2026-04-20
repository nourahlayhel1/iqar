import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';

export type AppLanguage = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  private readonly document = inject(DOCUMENT);
  private readonly http = inject(HttpClient);
  private readonly dictionary = signal<Record<string, unknown>>({});
  private readonly storage = this.document.defaultView?.localStorage;

  readonly language = signal<AppLanguage>('en');

  constructor() {
    this.language.set(this.readStoredValue<AppLanguage>('iqar-language', 'en', ['en', 'ar']));
    this.applyLanguage();
    this.loadTranslations(this.language());
  }

  toggleLanguage(): void {
    const nextLanguage = this.language() === 'en' ? 'ar' : 'en';
    this.language.set(nextLanguage);
    this.storage?.setItem('iqar-language', nextLanguage);
    this.applyLanguage();
    this.loadTranslations(nextLanguage);
  }

  translate(key: string): string {
    const value = key
      .split('.')
      .reduce<unknown>((current, segment) => {
        if (typeof current !== 'object' || current === null || !(segment in current)) {
          return undefined;
        }

        return (current as Record<string, unknown>)[segment];
      }, this.dictionary());

    return typeof value === 'string' ? value : key;
  }

  private applyLanguage(): void {
    const language = this.language();
    this.document.documentElement.setAttribute('lang', language);
    this.document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }

  private loadTranslations(language: AppLanguage): void {
    this.http.get<Record<string, unknown>>(`assets/i18n/${language}.json`).subscribe({
      next: (dictionary) => this.dictionary.set(dictionary),
      error: () => this.dictionary.set({})
    });
  }

  private readStoredValue<T extends string>(key: string, fallback: T, allowed: T[]): T {
    const value = this.storage?.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  }
}
