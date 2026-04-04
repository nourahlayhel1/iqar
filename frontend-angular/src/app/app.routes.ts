import { Routes } from '@angular/router';
import { PropertiesPageComponent } from './features/properties/properties-page.component';
import { PropertyDetailPageComponent } from './features/properties/property-detail-page.component';
import { PropertyFormPageComponent } from './features/properties/property-form-page.component';
import { CustomersPageComponent } from './features/customers/customers-page.component';
import { CustomerDetailPageComponent } from './features/customers/customer-detail-page.component';
import { CustomerFormPageComponent } from './features/customers/customer-form-page.component';
import { OwnerDetailPageComponent } from './features/owners/owner-detail-page.component';
import { OwnerFormPageComponent } from './features/owners/owner-form-page.component';
import { OwnersPageComponent } from './features/owners/owners-page.component';
import { RequestsPageComponent } from './features/requests/requests-page.component';
import { RequestFormPageComponent } from './features/requests/request-form-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'properties' },
  { path: 'properties', component: PropertiesPageComponent },
  { path: 'properties/new', component: PropertyFormPageComponent },
  { path: 'properties/:id', component: PropertyDetailPageComponent },
  { path: 'properties/:id/edit', component: PropertyFormPageComponent },
  { path: 'customers', component: CustomersPageComponent },
  { path: 'customers/new', component: CustomerFormPageComponent },
  { path: 'customers/:id', component: CustomerDetailPageComponent },
  { path: 'customers/:id/edit', component: CustomerFormPageComponent },
  { path: 'owners', component: OwnersPageComponent },
  { path: 'owners/new', component: OwnerFormPageComponent },
  { path: 'owners/:id', component: OwnerDetailPageComponent },
  { path: 'owners/:id/edit', component: OwnerFormPageComponent },
  { path: 'requests', component: RequestsPageComponent },
  { path: 'requests/new', component: RequestFormPageComponent },
  { path: 'requests/:id/edit', component: RequestFormPageComponent },
  { path: '**', redirectTo: 'properties' }
];
