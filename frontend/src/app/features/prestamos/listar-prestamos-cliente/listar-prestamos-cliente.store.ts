import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { mensajeError } from '../_shared/errores-prestamo';
import { PrestamosDeClienteVista, mapearPrestamosDeCliente } from './listar-prestamos-cliente.mapper';
import { listarPrestamosCliente } from './listar-prestamos-cliente.request';

/** Estado de la lista de préstamos de un cliente. Se provee en la página, no en root. */
@Injectable()
export class ListarPrestamosClienteStore {
  private readonly http = inject(HttpClient);
  private suscripcion?: Subscription;

  private readonly _datos = signal<PrestamosDeClienteVista | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly datos = this._datos.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.suscripcion?.unsubscribe());
  }

  cargar(clienteId: string): void {
    this.suscripcion?.unsubscribe();
    this._cargando.set(true);
    this._error.set(null);

    this.suscripcion = listarPrestamosCliente(this.http, clienteId).subscribe({
      next: dto => {
        this._datos.set(mapearPrestamosDeCliente(dto));
        this._cargando.set(false);
      },
      error: (err: unknown) => {
        this._error.set(mensajeError(err));
        this._cargando.set(false);
      },
    });
  }
}
