import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { AmortizacionVista } from '../../consultar-prestamo.mapper';

@Component({
  selector: 'app-tabla-amortizaciones-prestamo',
  imports: [CurrencyPipe, TableModule, Tag],
  templateUrl: './tabla-amortizaciones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablaAmortizacionesPrestamo {
  readonly amortizaciones = input.required<AmortizacionVista[]>();
}
