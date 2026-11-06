import { ChangeDetectionStrategy, Component, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ArrowLeft } from '@primeicons/angular/arrow-left';
import { ButtonDirective } from 'primeng/button';
import { Tag } from 'primeng/tag';
import {
  CondicionesPrestamo,
  ConsultarPrestamoStore,
  ResumenPrestamo,
  TablaAmortizacionesPrestamo,
} from '../consultar-prestamo';

/**
 * Página de la ruta prestamos/:id.
 * Une la rebanada consultar-prestamo a través de su index.ts.
 */
@Component({
  selector: 'app-detalle-prestamo',
  imports: [
    RouterLink,
    ButtonDirective,
    Tag,
    ArrowLeft,
    ResumenPrestamo,
    TablaAmortizacionesPrestamo,
    CondicionesPrestamo,
  ],
  providers: [ConsultarPrestamoStore],
  templateUrl: './detalle-prestamo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetallePrestamo {
  /** Llega del parámetro :id con withComponentInputBinding(). */
  readonly id = input.required<string>();

  private readonly consultar = inject(ConsultarPrestamoStore);

  protected readonly prestamo = this.consultar.prestamo;
  protected readonly cargando = this.consultar.cargando;
  protected readonly error = this.consultar.error;

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.consultar.cargar(id));
    });
  }

  protected recargar(): void {
    this.consultar.cargar(this.id());
  }
}
