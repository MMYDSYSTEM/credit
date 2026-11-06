import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { prestamosDeClienteUrl } from '../_shared/prestamos-api';
import { PrestamosDeClienteDto } from './listar-prestamos-cliente.dto';

/** QUERY GET /api/clientes/{id}/prestamos */
export function listarPrestamosCliente(http: HttpClient, clienteId: string): Observable<PrestamosDeClienteDto> {
  return http.get<PrestamosDeClienteDto>(prestamosDeClienteUrl(clienteId));
}
