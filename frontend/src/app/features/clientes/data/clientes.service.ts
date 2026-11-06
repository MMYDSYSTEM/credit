import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cliente } from './cliente.model';

/** Un método por endpoint. La URL base del backend la agrega core/http/api-url.interceptor. */
@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/clientes';

  /** GET /api/clientes: los más recientes primero. En desarrollo lo responde el backend simulado. */
  getAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.url);
  }
}
