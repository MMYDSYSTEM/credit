import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Antepone environment.apiUrl a las peticiones relativas a /api/...
 * Así los servicios de data/ usan rutas como '/api/prestamos' sin importar environments.
 * Con apiUrl vacío la URL queda igual (rutas relativas).
 */
export const apiUrlInterceptor: HttpInterceptorFn = (req, next) =>
  environment.apiUrl && req.url.startsWith('/api/')
    ? next(req.clone({ url: `${environment.apiUrl}${req.url}` }))
    : next(req);
