import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'registrar' },
  {
    path: 'registrar',
    loadComponent: () => import('./registrar-prestamo/registrar-prestamo').then(m => m.RegistrarPrestamo),
  },
  {
    // Nuevo préstamo para un cliente existente (sin préstamo activo).
    path: 'registrar/:clienteId',
    loadComponent: () => import('./registrar-prestamo/registrar-prestamo').then(m => m.RegistrarPrestamo),
  },
  {
    path: 'cliente/:clienteId',
    loadComponent: () =>
      import('./listar-prestamos-cliente/listar-prestamos-cliente').then(m => m.ListarPrestamosCliente),
  },
  {
    path: ':id',
    loadComponent: () => import('./detalle-prestamo/detalle-prestamo').then(m => m.DetallePrestamo),
  },
];
