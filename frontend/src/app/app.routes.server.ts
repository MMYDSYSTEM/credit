import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // La fecha de inicio por defecto depende de "hoy" en el navegador del usuario,
    // no del día en que se hizo la build.
    path: 'prestamos/registrar',
    renderMode: RenderMode.Client
  },
  {
    // Datos del backend (o del simulador en memoria del navegador): se renderizan en el navegador.
    path: 'clientes',
    renderMode: RenderMode.Client
  },
  {
    path: 'prestamos/registrar/:clienteId',
    renderMode: RenderMode.Client
  },
  {
    path: 'prestamos/cliente/:clienteId',
    renderMode: RenderMode.Client
  },
  {
    path: 'prestamos/:id',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
