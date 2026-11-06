import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { mensajeError } from '../_shared/errores-prestamo';
import { PrestamoVista, mapearPrestamo } from './consultar-prestamo.mapper';
import { consultarPrestamo } from './consultar-prestamo.request';

/** Estado de la consulta de un préstamo. Se provee en la página, no en root. */
@Injectable()
export class ConsultarPrestamoStore {
  private readonly http = inject(HttpClient);
  private suscripcion?: Subscription;

  private readonly _prestamo = signal<PrestamoVista | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly prestamo = this._prestamo.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.suscripcion?.unsubscribe());
  }

  cargar(id: string): void {
    this.suscripcion?.unsubscribe();
    this._cargando.set(true);
    this._error.set(null);

    this.suscripcion = consultarPrestamo(this.http, id).subscribe({
      next: dto => {
        this._prestamo.set(mapearPrestamo(dto));
        this._cargando.set(false);
      },
      error: (err: unknown) => {
        this._error.set(mensajeError(err));
        this._cargando.set(false);
      },
    });
  }
}
