import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Customer } from './models';

@Injectable({ providedIn: 'root' })
export class CustomersApiService extends ApiBaseService {
  private readonly http = inject(HttpClient);

  list(q?: string): Observable<Customer[]> {
    return this.http
      .get<{ customers: Customer[] }>(`${this.baseUrl}/api/customers`, { params: this.buildParams({ q }) })
      .pipe(map((response) => response.customers));
  }

  getById(id: string): Observable<Customer> {
    return this.http.get<{ customer: Customer }>(`${this.baseUrl}/api/customers/${id}`).pipe(map((response) => response.customer));
  }

  create(payload: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Observable<Customer> {
    return this.http.post<{ customer: Customer }>(`${this.baseUrl}/api/customers`, payload).pipe(map((response) => response.customer));
  }

  update(id: string, payload: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Observable<Customer> {
    return this.http.put<{ customer: Customer }>(`${this.baseUrl}/api/customers/${id}`, payload).pipe(map((response) => response.customer));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/customers/${id}`);
  }
}
