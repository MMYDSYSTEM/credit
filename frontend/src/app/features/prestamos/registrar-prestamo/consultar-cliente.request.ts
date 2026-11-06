import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClienteExistenteDto } from './registrar-prestamo.dto';

/** QUERY GET /api/clientes/{id}: datos del cliente existente para el que se genera el préstamo. */
export function consultarCliente(http: HttpClient, clienteId: string): Observable<ClienteExistenteDto> {
  return http.get<ClienteExistenteDto>(`${environment.apiUrl}/api/clientes/${encodeURIComponent(clienteId)}`);
}
