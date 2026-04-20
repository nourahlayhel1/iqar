import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  COMMON_AMENITIES,
  CURRENCIES,
  PROPERTY_AMENITIES_BY_TYPE,
  PROPERTY_CONDITIONS,
  PROPERTY_SOURCES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_TYPES_WITH_BATHROOMS,
  PROPERTY_TYPES_WITH_BEDROOMS
} from './constants';
import { Property } from './models';
import { PropertiesApiService } from './properties-api.service';

type PropertyCreatePayload = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
type ImportResult = { importedCount: number; errors: string[] };

const TEMPLATE_COLUMNS = [
  { header: 'id', key: 'propertyCode', width: 12 },
  { header: 'type', key: 'type', width: 16 },
  { header: 'propertyNumber', key: 'propertyNumber', width: 16 },
  { header: 'ownerName', key: 'ownerName', width: 24 },
  { header: 'source', key: 'source', width: 16 },
  { header: 'agentName', key: 'agentName', width: 24 },
  { header: 'phone', key: 'ownerPhone', width: 18 },
  { header: 'status', key: 'listingStatus', width: 16 },
  { header: 'size_sqm', key: 'areaSqm', width: 14 },
  { header: 'zoning', key: 'zoning', width: 14 },
  { header: 'location', key: 'locationText', width: 28 },
  { header: 'pricePerSqm', key: 'pricePerSqm', width: 14 },
  { header: 'finalPrice', key: 'price', width: 14 },
  { header: 'currency', key: 'currency', width: 12 },
  { header: 'bedrooms', key: 'bedrooms', width: 12 },
  { header: 'bathrooms', key: 'bathrooms', width: 12 },
  { header: 'parking', key: 'parking', width: 12 },
  { header: 'furnished', key: 'furnished', width: 12 },
  { header: 'condition', key: 'condition', width: 18 },
  { header: 'age', key: 'age', width: 12 },
  { header: 'negotiable', key: 'negotiable', width: 14 },
  { header: 'notes', key: 'notes', width: 26 },
  { header: 'title', key: 'title', width: 30 },
  { header: 'description', key: 'description', width: 36 },
  { header: 'city', key: 'city', width: 18 },
  { header: 'floor', key: 'floor', width: 10 },
  { header: 'amenities', key: 'amenities', width: 36 },
  { header: 'images', key: 'images', width: 42 }
];

@Injectable({ providedIn: 'root' })
export class PropertyExcelService {
  private readonly api = inject(PropertiesApiService);

  async downloadTemplate(): Promise<void> {
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Properties');

    sheet.columns = TEMPLATE_COLUMNS;
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    const headerRow = sheet.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF050B18' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF00B2FF' } },
        bottom: { style: 'thin', color: { argb: 'FF00B2FF' } }
      };
    });

    sheet.addRow({
      propertyCode: 'P01',
      type: 'Land',
      propertyNumber: 565,
      ownerName: 'Ziad Msalem',
      source: 'Direct',
      ownerPhone: '03 280 100',
      listingStatus: 'For Sale',
      areaSqm: 1870,
      zoning: '25/75',
      locationText: 'Koura / Btouratij',
      pricePerSqm: 150,
      price: 280500,
      currency: 'USD',
      notes: 'بتوراتیج الكورة'
    });

    this.applyDropdownValidation(sheet, 'B', PROPERTY_TYPES.map((item) => this.toTitleCase(item)));
    this.applyDropdownValidation(sheet, 'E', PROPERTY_SOURCES);
    this.applyDropdownValidation(sheet, 'H', PROPERTY_STATUSES);
    this.applyDropdownValidation(sheet, 'N', CURRENCIES);
    this.applyDropdownValidation(sheet, 'Q', ['Yes', 'No', '1', '0']);
    this.applyDropdownValidation(sheet, 'R', ['Yes', 'No', '1', '0']);
    this.applyDropdownValidation(sheet, 'S', PROPERTY_CONDITIONS);
    this.applyDropdownValidation(sheet, 'U', ['Yes', 'No', '1', '0']);
    this.applyDropdownValidation(sheet, 'Z', []);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'properties-import-template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  async importFile(file: File): Promise<ImportResult> {
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return { importedCount: 0, errors: ['Excel file has no worksheet.'] };
    }

    const headers = this.getHeaders(sheet.getRow(1).values);
    let importedCount = 0;
    const errors: string[] = [];

    for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      if (!row.hasValues) {
        continue;
      }

      try {
        const rowData = this.rowToObject(headers, row.values);
        const payload = this.toPropertyPayload(rowData, rowNumber);
        await firstValueFrom(this.api.create(payload));
        importedCount += 1;
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { importedCount, errors };
  }

  private applyDropdownValidation(sheet: import('exceljs').Worksheet, column: string, values: string[]): void {
    if (!values.length) {
      return;
    }

    for (let row = 2; row <= 500; row += 1) {
      sheet.getCell(`${column}${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${values.join(',')}"`]
      };
    }
  }

  private getHeaders(values: import('exceljs').CellValue[] | { [key: string]: import('exceljs').CellValue }): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    return values.map((value) => this.asString(value).trim());
  }

  private rowToObject(
    headers: string[],
    values: import('exceljs').CellValue[] | { [key: string]: import('exceljs').CellValue }
  ): Record<string, string | number | boolean | undefined> {
    const rowObject: Record<string, string | number | boolean | undefined> = {};
    if (!Array.isArray(values)) {
      return rowObject;
    }

    headers.forEach((header, index) => {
      if (!header) {
        return;
      }

      const cellValue = values[index];
      rowObject[header] = this.asPrimitive(cellValue);
    });

    return rowObject;
  }

  private toPropertyPayload(row: Record<string, string | number | boolean | undefined>, rowNumber: number): PropertyCreatePayload {
    const type = this.normalizeType(this.asText(row['type']));
    const purpose = this.normalizePurpose(this.asText(row['status']));
    const location = this.resolveLocation(row);
    const propertyCode = this.asText(row['id']) || this.asText(row['propertyCode']) || undefined;
    const propertyNumber = this.asNumberValue(row['propertyNumber']);
    const title =
      this.asText(row['title']) ||
      [this.toTitleCase(type), location.city, propertyNumber ? `#${propertyNumber}` : propertyCode]
        .filter(Boolean)
        .join(' ');
    const description =
      this.asText(row['description']) ||
      this.asText(row['notes']) ||
      `${this.toTitleCase(type)} in ${location.city}`;
    const pricePerSqm = this.asNumberValue(row['pricePerSqm']);
    const areaSqm = this.asNumberValue(row['size_sqm']) ?? this.asNumberValue(row['areaSqm']);
    const price =
      this.asNumberValue(row['finalPrice']) ??
      this.asNumberValue(row['price']) ??
      (pricePerSqm !== undefined && areaSqm !== undefined ? pricePerSqm * areaSqm : 0);

    if (!title || !description || !location.city) {
      throw new Error('Missing required title, description, or city fields.');
    }

    if (!type) {
      throw new Error('Invalid property type.');
    }

    if (!purpose) {
      throw new Error('Invalid status. Use For Sale or For Rent.');
    }

    const allowedAmenities = new Set(PROPERTY_AMENITIES_BY_TYPE[type] ?? COMMON_AMENITIES);
    const amenities = this.parseList(this.asText(row['amenities'])).filter((amenity) => allowedAmenities.has(amenity));
    if (allowedAmenities.has('parking') && this.asBooleanValue(row['parking'])) {
      amenities.push('parking');
    }
    if (allowedAmenities.has('furnished') && this.asBooleanValue(row['furnished'])) {
      amenities.push('furnished');
    }

    return {
      propertyCode,
      propertyNumber,
      source: this.normalizeSource(this.asText(row['source'])),
      agentName: this.asText(row['agentName']) || undefined,
      listingStatus: this.asText(row['status']) || undefined,
      zoning: this.asText(row['zoning']) || undefined,
      pricePerSqm,
      condition: this.asText(row['condition']) || undefined,
      age: this.asText(row['age']) || undefined,
      negotiable: this.asBooleanValue(row['negotiable']),
      notes: this.asText(row['notes']) || undefined,
      title,
      description,
      type,
      purpose,
      price,
      currency: this.normalizeCurrency(this.asText(row['currency'])),
      location,
      bedrooms: PROPERTY_TYPES_WITH_BEDROOMS.includes(type) ? this.asNumberValue(row['bedrooms']) : undefined,
      bathrooms: PROPERTY_TYPES_WITH_BATHROOMS.includes(type) ? this.asNumberValue(row['bathrooms']) : undefined,
      areaSqm,
      floor: type === 'land' ? undefined : this.asNumberValue(row['floor']),
      parking: allowedAmenities.has('parking') ? this.asBooleanValue(row['parking']) : false,
      furnished: allowedAmenities.has('furnished') ? this.asBooleanValue(row['furnished']) : false,
      amenities: [...new Set(amenities)],
      images: this.parseList(this.asText(row['images'])),
      ownerName: this.asText(row['ownerName']) || undefined,
      ownerPhone: this.asText(row['phone']) || this.asText(row['ownerPhone']) || undefined
    };
  }

  private resolveLocation(row: Record<string, string | number | boolean | undefined>) {
    const city = this.asText(row['city']);
    const locationText = this.asText(row['location']);
    const locationParts = locationText
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      city: city || locationParts[0] || 'Unknown'
    };
  }

  private normalizeType(value: string): Property['type'] {
    const normalized = value.trim().toLowerCase();
    return PROPERTY_TYPES.includes(normalized as Property['type']) ? (normalized as Property['type']) : 'other';
  }

  private normalizePurpose(value: string): Property['purpose'] | '' {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'for sale' || normalized === 'sale') {
      return 'sale';
    }
    if (normalized === 'for rent' || normalized === 'rent') {
      return 'rent';
    }
    return '';
  }

  private normalizeCurrency(value: string): Property['currency'] {
    const normalized = value.trim().toUpperCase();
    return CURRENCIES.includes(normalized as Property['currency']) ? (normalized as Property['currency']) : 'USD';
  }

  private normalizeSource(value: string): Property['source'] {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['broker', 'by_broker'].includes(normalized)) {
      return 'broker';
    }
    return 'direct_owner';
  }

  private parseList(value: string): string[] {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private asPrimitive(value: import('exceljs').CellValue): string | number | boolean | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      if ('text' in value && typeof value.text === 'string') {
        return value.text;
      }
      if ('result' in value) {
        return this.asPrimitive(value.result as import('exceljs').CellValue);
      }
      if ('richText' in value && Array.isArray(value.richText)) {
        return value.richText.map((item) => item.text).join('');
      }
    }
    return String(value);
  }

  private asString(value: import('exceljs').CellValue | undefined): string {
    const primitive = this.asPrimitive(value as import('exceljs').CellValue);
    return primitive === undefined ? '' : String(primitive);
  }

  private asText(value: string | number | boolean | undefined): string {
    return value === undefined || value === null ? '' : String(value).trim();
  }

  private asNumberValue(value: string | number | boolean | undefined): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  private asBooleanValue(value: string | number | boolean | undefined): boolean | undefined {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value > 0;
    }

    const normalized = this.asText(value).toLowerCase();
    if (!normalized) {
      return undefined;
    }

    if (['yes', 'true', '1', 'y'].includes(normalized)) {
      return true;
    }
    if (['no', 'false', '0', 'n'].includes(normalized)) {
      return false;
    }
    return undefined;
  }

  private toTitleCase(value: string): string {
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1).toLowerCase()}` : value;
  }
}
