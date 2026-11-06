import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ClienteExistente,
  Prestamo,
  PrestamoRegistrado,
  PrestamosDeCliente,
  DatosRegistro,
} from './prestamo.model';

/** Un método por endpoint. La URL base del backend la agrega core/http/api-url.interceptor. */
@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/prestamos';
  private readonly urlClientes = '/api/clientes';

  /** GET /api/prestamos/{id} */
  prestamo(id: string): Observable<Prestamo> {
    return this.http.get<Prestamo>(`${this.url}/${encodeURIComponent(id)}`);
  }

  /** GET /api/clientes/{id}/prestamos */
  prestamosDeCliente(clienteId: string): Observable<PrestamosDeCliente> {
    return this.http.get<PrestamosDeCliente>(`${this.urlClientes}/${encodeURIComponent(clienteId)}/prestamos`);
  }

  /** GET /api/clientes/{id}: cliente existente para el que se genera el préstamo. */
  cliente(clienteId: string): Observable<ClienteExistente> {
    return this.http.get<ClienteExistente>(`${this.urlClientes}/${encodeURIComponent(clienteId)}`);
  }

  /** POST /api/prestamos → 201 { id, folio, clienteId } */
  registrar(datos: DatosRegistro): Observable<PrestamoRegistrado> {
    return this.http.post<PrestamoRegistrado>(this.url, datos);
  }
}
