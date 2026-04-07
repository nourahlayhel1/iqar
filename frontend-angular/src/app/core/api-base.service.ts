import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiBaseService {
  protected readonly baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  protected buildParams(
    values: Record<string, string | number | string[] | undefined | null> | object
  ): HttpParams {
    let params = new HttpParams();

    Object.entries(values as Record<string, string | number | string[] | undefined | null>).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) {
            params = params.append(key, item);
          }
        });
        return;
      }

      params = params.set(key, String(value));
    });

    return params;
  }
}
