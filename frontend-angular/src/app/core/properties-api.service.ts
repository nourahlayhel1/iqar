import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiBaseService } from './api-base.service';
import { Property, PropertyQuery } from './models';

@Injectable({ providedIn: 'root' })
export class PropertiesApiService extends ApiBaseService {
  private readonly http = inject(HttpClient);

  list(query: PropertyQuery = {}): Observable<Property[]> {
    return this.http
      .get<{ properties: Property[] }>(`${this.baseUrl}/api/properties`, { params: this.buildParams(query) })
      .pipe(map((response) => response.properties));
  }

  getById(id: string): Observable<Property> {
    return this.http.get<{ property: Property }>(`${this.baseUrl}/api/properties/${id}`).pipe(map((response) => response.property));
  }

  create(
    payload: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[] = [],
    coverImageUploadIndex = -1
  ): Observable<Property> {
    return this.http
      .post<{ property: Property }>(
        `${this.baseUrl}/api/properties`,
        this.toFormData(payload, imageFiles, coverImageUploadIndex)
      )
      .pipe(map((response) => response.property));
  }

  update(
    id: string,
    payload: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[] = [],
    coverImageUploadIndex = -1
  ): Observable<Property> {
    return this.http
      .put<{ property: Property }>(
        `${this.baseUrl}/api/properties/${id}`,
        this.toFormData(payload, imageFiles, coverImageUploadIndex)
      )
      .pipe(map((response) => response.property));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/properties/${id}`);
  }

  private toFormData(
    payload: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[],
    coverImageUploadIndex: number
  ): FormData {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    imageFiles.forEach((image) => formData.append('images', image));
    if (coverImageUploadIndex >= 0) formData.append('coverImageUploadIndex', String(coverImageUploadIndex));
    return formData;
  }
}
