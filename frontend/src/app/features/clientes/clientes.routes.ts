import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./ui/pages/lista-clientes/lista-clientes').then(m => m.ListaClientes) },
];
