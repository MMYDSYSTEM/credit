import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { prestamosUrl } from '../_shared/prestamos-api';
import { PrestamoRegistradoDto, RegistrarPrestamoDto } from './registrar-prestamo.dto';

/** COMMAND POST /api/prestamos → 201 { id, folio } */
export function registrarPrestamo(http: HttpClient, datos: RegistrarPrestamoDto): Observable<PrestamoRegistradoDto> {
  return http.post<PrestamoRegistradoDto>(prestamosUrl(), datos);
}
