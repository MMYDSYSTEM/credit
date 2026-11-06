import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PrestamoVista } from '../../../data/prestamo.mapper';

@Component({
  selector: 'app-resumen-prestamo',
  imports: [CurrencyPipe],
  templateUrl: './resumen-prestamo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenPrestamo {
  readonly prestamo = input.required<PrestamoVista>();
}
