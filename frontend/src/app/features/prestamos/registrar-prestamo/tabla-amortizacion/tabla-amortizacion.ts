import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { AmortizacionProyectada } from '../registrar-prestamo.calculos';

/** Tabla de amortización proyectada del alta (vista previa, sin estado de pago). */
@Component({
  selector: 'app-tabla-amortizacion',
  imports: [CurrencyPipe, TableModule],
  templateUrl: './tabla-amortizacion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaAmortizacion {
  readonly amortizaciones = input.required<AmortizacionProyectada[]>();

  protected readonly totales = computed(() => {
    const suma = (campo: 'pago' | 'capital' | 'interes' | 'gastos') =>
      Math.round(this.amortizaciones().reduce((total, a) => total + a[campo], 0) * 100) / 100;
    return { pago: suma('pago'), capital: suma('capital'), interes: suma('interes'), gastos: suma('gastos') };
  });
}
