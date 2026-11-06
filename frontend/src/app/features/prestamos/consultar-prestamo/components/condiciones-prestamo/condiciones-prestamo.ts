import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PrestamoVista } from '../../consultar-prestamo.mapper';

@Component({
  selector: 'app-condiciones-prestamo',
  imports: [CurrencyPipe],
  templateUrl: './condiciones-prestamo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CondicionesPrestamo {
  readonly prestamo = input.required<PrestamoVista>();
}
