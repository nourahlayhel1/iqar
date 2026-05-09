import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { concatMap, from, map, Observable, switchMap, toArray } from 'rxjs';
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
    return this.uploadImages(payload.title, imageFiles, coverImageUploadIndex, 1).pipe(
      switchMap((uploadedImages) => {
        const images = [...payload.images, ...uploadedImages];
        const coverImage =
          coverImageUploadIndex >= 0 ? uploadedImages[coverImageUploadIndex] : payload.coverImage || images[0];

        return this.http.post<{ property: Property }>(`${this.baseUrl}/api/properties`, {
          ...payload,
          images,
          coverImage
        });
      }),
      map((response) => response.property)
    );
  }

  update(
    id: string,
    payload: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>,
    imageFiles: File[] = [],
    coverImageUploadIndex = -1
  ): Observable<Property> {
    const startingPhotoNumber = payload.images.filter((image) => image !== payload.coverImage).length + 1;

    return this.uploadImages(payload.title, imageFiles, coverImageUploadIndex, startingPhotoNumber).pipe(
      switchMap((uploadedImages) => {
        const images = [...payload.images, ...uploadedImages];
        const coverImage =
          coverImageUploadIndex >= 0 ? uploadedImages[coverImageUploadIndex] : payload.coverImage || images[0];

        return this.http.put<{ property: Property }>(`${this.baseUrl}/api/properties/${id}`, {
          ...payload,
          images,
          coverImage
        });
      }),
      map((response) => response.property)
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/properties/${id}`);
  }

  private uploadImages(
    propertyTitle: string,
    imageFiles: File[],
    coverImageUploadIndex: number,
    startingPhotoNumber: number
  ): Observable<string[]> {
    if (!imageFiles.length) {
      return from([[] as string[]]);
    }

    let nextPhotoNumber = startingPhotoNumber;

    return from(imageFiles).pipe(
      concatMap((image, index) => {
        const useAsCover = index === coverImageUploadIndex;
        const photoNumber = useAsCover ? startingPhotoNumber : nextPhotoNumber++;
        return this.uploadImage(propertyTitle, image, photoNumber, useAsCover);
      }),
      toArray()
    );
  }

  private uploadImage(propertyTitle: string, imageFile: File, photoNumber: number, useAsCover: boolean): Observable<string> {
    const formData = new FormData();
    formData.append('title', propertyTitle || 'property');
    formData.append('photoNumber', String(photoNumber));
    formData.append('useAsCover', String(useAsCover));
    formData.append('image', imageFile);

    return this.http
      .post<{ imagePath: string }>(`${this.baseUrl}/api/property-images`, formData)
      .pipe(map((response) => response.imagePath));
  }
}
