import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/cliente-list/cliente-list').then(m => m.ClienteList) },
];
