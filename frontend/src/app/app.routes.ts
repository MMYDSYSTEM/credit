import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'clientes' },
      { path: 'clientes', loadChildren: () => import('./features/clientes/clientes.routes').then(m => m.CLIENTES_ROUTES) },
      { path: 'prestamos', loadChildren: () => import('./features/prestamos').then(m => m.PRESTAMOS_ROUTES) },
    ],
  },
];
