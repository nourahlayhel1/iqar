import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Owner } from './models';

@Injectable({ providedIn: 'root' })
export class OwnersApiService extends ApiBaseService {
  private readonly http = inject(HttpClient);

  list(q?: string): Observable<Owner[]> {
    return this.http
      .get<{ owners: Owner[] }>(`${this.baseUrl}/api/owners`, { params: this.buildParams({ q }) })
      .pipe(map((response) => response.owners));
  }

  getById(id: string): Observable<Owner> {
    return this.http.get<{ owner: Owner }>(`${this.baseUrl}/api/owners/${id}`).pipe(map((response) => response.owner));
  }

  create(payload: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Observable<Owner> {
    return this.http.post<{ owner: Owner }>(`${this.baseUrl}/api/owners`, payload).pipe(map((response) => response.owner));
  }

  update(id: string, payload: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Observable<Owner> {
    return this.http.put<{ owner: Owner }>(`${this.baseUrl}/api/owners/${id}`, payload).pipe(map((response) => response.owner));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/owners/${id}`);
  }
}
