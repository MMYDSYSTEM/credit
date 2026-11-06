import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cliente } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);

  /** GET /api/clientes: los más recientes primero. En desarrollo lo responde el backend simulado. */
  getAll(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${environment.apiUrl}/api/clientes`);
  }
}
