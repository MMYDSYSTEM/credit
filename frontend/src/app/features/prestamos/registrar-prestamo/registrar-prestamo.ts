import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { map, merge } from 'rxjs';
import {
  AmortizacionProyectada,
  DIAS_MINIMOS_PRIMER_PAGO,
  PAGOS_POR_MES,
  calcularAmortizaciones,
  calcularFechaInicio,
  calcularFechaTermino,
  calcularNumeroPagos,
  calcularPago,
  fechaDeHoy,
} from './registrar-prestamo.calculos';
import { RegistrarPrestamoDto } from './registrar-prestamo.dto';
import { RegistrarPrestamoStore } from './registrar-prestamo.store';
import { MAX_NOMBRE, PATRON_NOMBRE, entero, noVacio } from './registrar-prestamo.validaciones';
import { TablaAmortizacion } from './tabla-amortizacion/tabla-amortizacion';

const DIA_PAGO_INICIAL = 'Lunes';
const VALIDADORES_NOMBRE = [
  noVacio,
  Validators.maxLength(MAX_NOMBRE),
  Validators.pattern(PATRON_NOMBRE),
];

/**
 * Pantalla "Generar Préstamo": crea un cliente nuevo junto con las condiciones de su préstamo.
 * Valida los datos antes de enviarlos y calcula los valores derivados
 * (fecha de inicio, plazo, pago y fecha de término). El backend vuelve a validar todo.
 * "Ver Detalle" muestra la tabla de amortización proyectada; al generar, lleva a la lista de clientes.
 */
@Component({
  selector: 'app-registrar-prestamo',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    InputText,
    InputNumber,
    Select,
    ButtonDirective,
    Dialog,
    TablaAmortizacion,
  ],
  providers: [RegistrarPrestamoStore],
  templateUrl: './registrar-prestamo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrarPrestamo {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(RegistrarPrestamoStore);
  private readonly router = inject(Router);

  /**
   * Llega del parámetro :clienteId (ruta registrar/:clienteId) con withComponentInputBinding().
   * Sin él, el préstamo es para un cliente nuevo.
   */
  readonly clienteId = input<string | undefined>();

  protected readonly procesando = this.store.procesando;
  protected readonly error = this.store.error;

  /** Cliente existente (null si es un cliente nuevo o aún no carga). */
  protected readonly cliente = this.store.cliente;
  protected readonly cargandoCliente = this.store.cargandoCliente;
  protected readonly errorCliente = this.store.errorCliente;
  protected readonly esClienteExistente = computed(() => !!this.clienteId());
  protected readonly nombreCliente = computed(() => {
    const c = this.cliente();
    return c ? [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ') : '';
  });
  /** Con un cliente existente, no se puede continuar hasta cargarlo, ni si ya tiene un préstamo activo. */
  protected readonly bloqueado = computed(
    () =>
      this.esClienteExistente() &&
      (this.cargandoCliente() || !!this.errorCliente() || !this.cliente() || !!this.cliente()?.prestamoActivo),
  );

  /** Diálogo "Ver Detalle" con la tabla de amortización proyectada. */
  protected readonly mostrarDetalle = signal(false);
  protected readonly amortizaciones = signal<AmortizacionProyectada[]>([]);
  protected readonly resumen = signal<{ plazo: number; pago: number; diaPago: string; total: number } | null>(
    null,
  );

  /** Días de cobro: de lunes a sábado. */
  protected readonly dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  protected readonly maxNombre = MAX_NOMBRE;
  protected readonly pagosPorMes = PAGOS_POR_MES;
  protected readonly diasMinimosPrimerPago = DIAS_MINIMOS_PRIMER_PAGO;

  protected readonly form = this.fb.group({
    cliente: this.fb.group({
      nombre: ['', VALIDADORES_NOMBRE],
      apellidoPaterno: ['', VALIDADORES_NOMBRE],
      apellidoMaterno: ['', VALIDADORES_NOMBRE],
      // Opcional: vacío es válido; si se escribe, debe tener formato de email.
      email: ['', Validators.email],
    }),
    condiciones: this.fb.group({
      monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      tasaMensual: this.fb.control<number | null>(15, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(100),
      ]),
      diaPago: [DIA_PAGO_INICIAL, Validators.required],
      /*
       * Campos calculados: disabled (no se editan ni se validan; Angular omite los disabled).
       * Siempre tienen valor al enviar porque dependen de campos obligatorios (día de pago, monto, meses),
       * y se envían porque generar() usa getRawValue().
       */
      // Calculado: pago semanal = (monto + monto × tasa × meses) ÷ plazo.
      pago: this.fb.control<number | null>({ value: null, disabled: true }),
      // Calculado: meses × 4 (número de pagos semanales).
      plazo: this.fb.control<number | null>({ value: null, disabled: true }),
      meses: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), entero]),
      // Por defecto, hoy (editable).
      fechaEntrega: [fechaDeHoy(), Validators.required],
      // Calculada: primer pago, el primer día de cobro al menos 7 días después de la entrega.
      fechaInicio: [{ value: calcularFechaInicio(fechaDeHoy(), DIA_PAGO_INICIAL), disabled: true }],
      // Calculada: inicio + (plazo − 1) semanas.
      fechaTermino: [{ value: '', disabled: true }],
    }),
  });

  /** true cuando todos los campos editables son válidos (actualiza la vista con OnPush). */
  protected readonly formularioValido = toSignal(
    this.form.statusChanges.pipe(map(estado => estado === 'VALID')),
    { initialValue: this.form.valid },
  );

  /** Ver Detalle y Generar Préstamo se habilitan solo con el formulario válido y sin bloqueo. */
  protected readonly puedeContinuar = computed(() => this.formularioValido() && !this.bloqueado());

  constructor() {
    // Cliente existente: sus datos no se capturan (grupo deshabilitado, no se valida) y se cargan del backend.
    effect(() => {
      const clienteId = this.clienteId();
      untracked(() => {
        if (clienteId) {
          this.form.controls.cliente.disable();
          this.store.cargarCliente(clienteId);
        } else {
          this.form.controls.cliente.enable();
        }
      });
    });

    // Cliente existente: sus datos llenan los campos (deshabilitados).
    effect(() => {
      const cliente = this.cliente();
      if (cliente) {
        untracked(() =>
          this.form.controls.cliente.patchValue({
            nombre: cliente.nombre,
            apellidoPaterno: cliente.apellidoPaterno,
            apellidoMaterno: cliente.apellidoMaterno,
            email: cliente.email ?? '',
          }),
        );
      }
    });

    const c = this.form.controls.condiciones.controls;

    // La fecha de inicio (primer pago) depende de la entrega y del día de pago.
    merge(c.fechaEntrega.valueChanges, c.diaPago.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        c.fechaInicio.setValue(calcularFechaInicio(c.fechaEntrega.value, c.diaPago.value)),
      );

    // El plazo (número de pagos) depende de los meses.
    c.meses.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((meses) => c.plazo.setValue(calcularNumeroPagos(meses)));

    // La fecha de término depende de la fecha de inicio y del plazo.
    merge(c.fechaInicio.valueChanges, c.plazo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        c.fechaTermino.setValue(calcularFechaTermino(c.fechaInicio.value, c.plazo.value)),
      );

    // El pago depende del monto, la tasa, los meses y el plazo.
    merge(
      c.monto.valueChanges,
      c.tasaMensual.valueChanges,
      c.meses.valueChanges,
      c.plazo.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        c.pago.setValue(
          calcularPago(c.monto.value, c.tasaMensual.value, c.meses.value, c.plazo.value),
        ),
      );
  }

  /** El campo tiene ese error y el usuario ya lo tocó (o intentó enviar). */
  protected tieneError(ruta: string, error: string): boolean {
    const control = this.form.get(ruta);
    return !!control && control.hasError(error) && (control.touched || control.dirty);
  }

  /** Datos listos para enviar. Solo se llama con el formulario válido: los numéricos ya no son null. */
  private datos(): RegistrarPrestamoDto {
    const { cliente, condiciones } = this.form.getRawValue();
    const condicionesDto = condiciones as RegistrarPrestamoDto['condiciones'];
    const clienteId = this.clienteId();
    if (clienteId) {
      return { clienteId, condiciones: condicionesDto };
    }
    return {
      cliente: {
        nombre: cliente.nombre.trim(),
        apellidoPaterno: cliente.apellidoPaterno.trim(),
        apellidoMaterno: cliente.apellidoMaterno.trim(),
        email: cliente.email.trim() || null, // sin email se envía null
      },
      condiciones: condicionesDto,
    };
  }

  /** Nombre para el mensaje de éxito: el del cliente existente o el capturado. */
  private nombreParaMensaje(): string {
    if (this.esClienteExistente()) {
      return this.nombreCliente();
    }
    const { nombre, apellidoPaterno, apellidoMaterno } = this.form.getRawValue().cliente;
    return [nombre, apellidoPaterno, apellidoMaterno].map(t => t.trim()).filter(Boolean).join(' ');
  }

  protected verDetalle(): void {
    if (!this.puedeContinuar()) {
      return;
    }
    const { condiciones } = this.datos();
    const amortizaciones = calcularAmortizaciones(condiciones);
    this.amortizaciones.set(amortizaciones);
    this.resumen.set({
      plazo: condiciones.plazo,
      pago: condiciones.pago,
      diaPago: condiciones.diaPago,
      total: Math.round(amortizaciones.reduce((total, a) => total + a.pago, 0) * 100) / 100,
    });
    this.mostrarDetalle.set(true);
  }

  protected async generar(): Promise<void> {
    if (this.procesando() || !this.puedeContinuar()) {
      this.form.markAllAsTouched();
      return;
    }
    if (await this.store.ejecutar(this.datos(), this.nombreParaMensaje())) {
      // Lleva a la lista de clientes, donde aparece el cliente con su préstamo.
      await this.router.navigate(['/clientes'], { state: { mensaje: this.store.exito() } });
    }
  }
}
