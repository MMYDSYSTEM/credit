import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Subscription, firstValueFrom } from 'rxjs';
import { mensajeError } from '../_shared/errores-prestamo';
import { consultarCliente } from './consultar-cliente.request';
import { ClienteExistenteDto, RegistrarPrestamoDto } from './registrar-prestamo.dto';
import { registrarPrestamo } from './registrar-prestamo.request';

/**
 * Estado del comando "registrar préstamo" y, si el préstamo es para un cliente existente,
 * de la consulta de ese cliente. Se provee en el componente, no en root.
 */
@Injectable()
export class RegistrarPrestamoStore {
  private readonly http = inject(HttpClient);
  private suscripcionCliente?: Subscription;

  private readonly _procesando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _exito = signal<string | null>(null);
  private readonly _cliente = signal<ClienteExistenteDto | null>(null);
  private readonly _cargandoCliente = signal(false);
  private readonly _errorCliente = signal<string | null>(null);

  readonly procesando = this._procesando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly exito = this._exito.asReadonly();
  /** Cliente existente para el que se genera el préstamo (null si es un cliente nuevo). */
  readonly cliente = this._cliente.asReadonly();
  readonly cargandoCliente = this._cargandoCliente.asReadonly();
  readonly errorCliente = this._errorCliente.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.suscripcionCliente?.unsubscribe());
  }

  cargarCliente(clienteId: string): void {
    this.suscripcionCliente?.unsubscribe();
    this._cargandoCliente.set(true);
    this._errorCliente.set(null);

    this.suscripcionCliente = consultarCliente(this.http, clienteId).subscribe({
      next: cliente => {
        this._cliente.set(cliente);
        this._cargandoCliente.set(false);
      },
      error: (err: unknown) => {
        this._errorCliente.set(mensajeError(err));
        this._cargandoCliente.set(false);
      },
    });
  }

  /** Registra el préstamo; devuelve true si el backend lo aceptó. */
  async ejecutar(datos: RegistrarPrestamoDto, nombreCliente: string): Promise<boolean> {
    this._procesando.set(true);
    this._error.set(null);
    this._exito.set(null);
    try {
      const { folio } = await firstValueFrom(registrarPrestamo(this.http, datos));
      this._exito.set(`Préstamo ${folio} generado para ${nombreCliente}.`);
      return true;
    } catch (err) {
      this._error.set(mensajeError(err));
      return false;
    } finally {
      this._procesando.set(false);
    }
  }
}
