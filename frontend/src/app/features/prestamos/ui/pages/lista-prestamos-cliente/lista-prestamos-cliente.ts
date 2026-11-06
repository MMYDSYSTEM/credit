import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowLeft } from '@primeicons/angular/arrow-left';
import { Eye } from '@primeicons/angular/eye';
import { ButtonDirective } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { PrestamosClienteStore } from '../../../data/prestamos-cliente.store';

/** Página de la ruta prestamos/cliente/:clienteId: préstamos que ha tenido un cliente. */
@Component({
  selector: 'app-lista-prestamos-cliente',
  imports: [CurrencyPipe, RouterLink, ButtonDirective, TableModule, Tag, ArrowLeft, Eye],
  providers: [PrestamosClienteStore],
  templateUrl: './lista-prestamos-cliente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaPrestamosCliente {
  /** Llega del parámetro :clienteId con withComponentInputBinding(). */
  readonly clienteId = input.required<string>();

  private readonly store = inject(PrestamosClienteStore);

  protected readonly datos = this.store.datos;
  protected readonly cargando = this.store.cargando;
  protected readonly error = this.store.error;

  constructor() {
    effect(() => {
      const clienteId = this.clienteId();
      untracked(() => this.store.cargar(clienteId));
    });
  }

  protected recargar(): void {
    this.store.cargar(this.clienteId());
  }
}
