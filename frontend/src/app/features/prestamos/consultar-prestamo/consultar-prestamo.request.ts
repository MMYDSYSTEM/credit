import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { prestamosUrl } from '../_shared/prestamos-api';
import { PrestamoDto } from './consultar-prestamo.dto';

/** QUERY GET /api/prestamos/{id} */
export function consultarPrestamo(http: HttpClient, id: string): Observable<PrestamoDto> {
  return http.get<PrestamoDto>(prestamosUrl(id));
}
