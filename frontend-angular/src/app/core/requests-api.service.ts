import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { CustomerRequest, Property } from './models';

@Injectable({ providedIn: 'root' })
export class RequestsApiService extends ApiBaseService {
  private readonly http = inject(HttpClient);

  list(customerId?: string): Observable<CustomerRequest[]> {
    return this.http
      .get<{ requests: CustomerRequest[] }>(`${this.baseUrl}/api/requests`, { params: this.buildParams({ customerId }) })
      .pipe(map((response) => response.requests));
  }

  getById(id: string): Observable<CustomerRequest> {
    return this.http.get<{ request: CustomerRequest }>(`${this.baseUrl}/api/requests/${id}`).pipe(map((response) => response.request));
  }

  create(payload: Omit<CustomerRequest, 'id' | 'createdAt' | 'updatedAt'>): Observable<CustomerRequest> {
    return this.http.post<{ request: CustomerRequest }>(`${this.baseUrl}/api/requests`, payload).pipe(map((response) => response.request));
  }

  update(id: string, payload: Omit<CustomerRequest, 'id' | 'createdAt' | 'updatedAt'>): Observable<CustomerRequest> {
    return this.http.put<{ request: CustomerRequest }>(`${this.baseUrl}/api/requests/${id}`, payload).pipe(map((response) => response.request));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/requests/${id}`);
  }

  findMatches(id: string): Observable<Property[]> {
    return this.http
      .get<{ matches: Property[] }>(`${this.baseUrl}/api/requests/${id}/matches`)
      .pipe(map((response) => response.matches));
  }
}
