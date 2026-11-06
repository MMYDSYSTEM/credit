import { Routes } from '@angular/router';

export const PRESTAMOS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'registrar' },
  {
    path: 'registrar',
    loadComponent: () =>
      import('./ui/pages/registrar-prestamo/registrar-prestamo').then(m => m.RegistrarPrestamo),
  },
  {
    // Nuevo préstamo para un cliente existente (sin préstamo activo).
    path: 'registrar/:clienteId',
    loadComponent: () =>
      import('./ui/pages/registrar-prestamo/registrar-prestamo').then(m => m.RegistrarPrestamo),
  },
  {
    path: 'cliente/:clienteId',
    loadComponent: () =>
      import('./ui/pages/lista-prestamos-cliente/lista-prestamos-cliente').then(m => m.ListaPrestamosCliente),
  },
  {
    path: ':id',
    loadComponent: () => import('./ui/pages/detalle-prestamo/detalle-prestamo').then(m => m.DetallePrestamo),
  },
];
