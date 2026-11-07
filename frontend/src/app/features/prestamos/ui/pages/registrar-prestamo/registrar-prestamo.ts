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
  calcularAmortizaciones,
  calcularAmortizacionesDiarias,
  calcularFechaInicio,
  calcularFechaTermino,
  calcularInicioDiario,
  calcularNumeroPagos,
  calcularPago,
  calcularPagoDiario,
  calcularPlazoDiario,
  fechaDeHoy,
} from '../../../data/prestamo.calculos';
import { CondicionesRegistro, DatosRegistro, TipoPrestamo } from '../../../data/prestamo.model';
import { RegistrarPrestamoStore } from '../../../data/registrar-prestamo.store';
import {
  MAX_NOMBRE,
  PATRON_NOMBRE,
  conDiasDeCobro,
  entero,
  noVacio,
  rangoFechas,
} from '../../../data/prestamo.validadores';
import { TablaAmortizacionProyectada } from '../../components/tabla-amortizacion-proyectada/tabla-amortizacion-proyectada';

// Reactive Forms: excepción 2 de la sección 5.5 del README (formulario existente, sin tarea aprobada de migración a Signal Forms).

const DIA_PAGO_INICIAL = 'Lunes';

/** Campos que solo usan Semanal, Quincenal y Mensual: en un préstamo diario se envían en null. */
const SIN_DIA_PAGO_NI_MESES = { diaPago: null, meses: null } satisfies Partial<CondicionesRegistro>;

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
    TablaAmortizacionProyectada,
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

  protected readonly tiposPrestamo: TipoPrestamo[] = ['Diario', 'Semanal', 'Quincenal', 'Mensual'];

  /** Días de cobro: de lunes a sábado. */
  protected readonly dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  protected readonly maxNombre = MAX_NOMBRE;
  protected readonly diasMinimosPrimerPago = DIAS_MINIMOS_PRIMER_PAGO;

  protected readonly form = this.fb.group({
    cliente: this.fb.group({
      nombre: ['', VALIDADORES_NOMBRE],
      apellidoPaterno: ['', VALIDADORES_NOMBRE],
      apellidoMaterno: ['', VALIDADORES_NOMBRE],
      // Opcional: vacío es válido; si se escribe, debe tener formato de email.
      email: ['', Validators.email],
    }),
    /*
     * Condiciones: los campos comunes van sueltos; los que dependen del tipo de préstamo, en un grupo por tipo.
     * Solo el grupo del tipo elegido está habilitado (aplicarTipo); un grupo deshabilitado no se valida.
     */
    condiciones: this.fb.group({
      // ── Comunes a todos los tipos ──
      tipoPrestamo: this.fb.control<TipoPrestamo>('Diario', Validators.required),
      monto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      // Porcentaje por periodo del tipo de préstamo (diario, semanal, quincenal o mensual).
      tasa: this.fb.control<number | null>(15, [Validators.required, Validators.min(0.01), Validators.max(100)]),
      // Por defecto, hoy (editable).
      fechaEntrega: [fechaDeHoy(), Validators.required],

      // ── Diario: se cobra de lunes a sábado ──
      diario: this.fb.group(
        {
          // Por defecto, el día siguiente a la entrega (sin domingo). Editable.
          fechaInicio: [calcularInicioDiario(fechaDeHoy()), Validators.required],
          fechaTermino: ['', Validators.required],
          // Calculados (solo lectura):
          // plazo = días entre inicio y fin, ambos incluidos, sin domingos
          plazo: this.fb.control<number | null>({ value: null, disabled: true }),
          // pago = (monto + monto × tasa) ÷ plazo
          pago: this.fb.control<number | null>({ value: null, disabled: true }),
        },
        { validators: [rangoFechas('fechaInicio', 'fechaTermino'), conDiasDeCobro('fechaInicio', 'fechaTermino')] },
      ),

      // ── Semanal, Quincenal y Mensual ──
      periodico: this.fb.group({
        diaPago: [DIA_PAGO_INICIAL, Validators.required],
        meses: this.fb.control<number | null>(null, [Validators.required, Validators.min(1), entero]),
        /*
         * Calculados: disabled (no se editan ni se validan) y se envían porque se lee getRawValue().
         * Siempre tienen valor al enviar porque dependen de campos obligatorios.
         */
        // pago = (monto + monto × tasa × meses) ÷ plazo
        pago: this.fb.control<number | null>({ value: null, disabled: true }),
        // plazo = meses × pagos por mes del tipo (Semanal 4, Quincenal 2, Mensual 1)
        plazo: this.fb.control<number | null>({ value: null, disabled: true }),
        // Primer pago: el primer día de cobro al menos 7 días después de la entrega.
        fechaInicio: [{ value: calcularFechaInicio(fechaDeHoy(), DIA_PAGO_INICIAL), disabled: true }],
        // inicio + (plazo − 1) × 7, 14 o 28 días según el tipo
        fechaTermino: [{ value: '', disabled: true }],
      }),
    }),
  });

  /** true cuando todos los campos editables son válidos (actualiza la vista con OnPush). */
  protected readonly formularioValido = toSignal(
    this.form.statusChanges.pipe(map(estado => estado === 'VALID')),
    { initialValue: this.form.valid },
  );

  /** Tipo de préstamo elegido. */
  protected readonly tipoPrestamo = toSignal(
    this.form.controls.condiciones.controls.tipoPrestamo.valueChanges,
    { initialValue: this.form.controls.condiciones.controls.tipoPrestamo.value },
  );

  /** Préstamo diario: fechas de inicio y fin en lugar de día de pago y meses. */
  protected readonly esDiario = computed(() => this.tipoPrestamo() === 'Diario');

  /** Título del porcentaje según el tipo: "Porcentaje Diario", "Porcentaje Semanal"… */
  protected readonly tituloPorcentaje = computed(() => `Porcentaje ${this.tipoPrestamo()}`);

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

    // Campos según el tipo de préstamo: al arrancar y cada vez que cambia.
    this.aplicarTipo(c.tipoPrestamo.value);
    c.tipoPrestamo.valueChanges.pipe(takeUntilDestroyed()).subscribe(tipo => this.aplicarTipo(tipo));

    // ── Calculados del préstamo diario ──
    const d = c.diario.controls;

    // La fecha de inicio por defecto se recalcula al cambiar la entrega (sigue siendo editable).
    c.fechaEntrega.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(entrega => d.fechaInicio.setValue(calcularInicioDiario(entrega)));

    // El plazo depende de las fechas de inicio y fin (sin domingos).
    merge(d.fechaInicio.valueChanges, d.fechaTermino.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => d.plazo.setValue(calcularPlazoDiario(d.fechaInicio.value, d.fechaTermino.value)));

    // El pago diario depende del monto, la tasa y el plazo.
    merge(c.monto.valueChanges, c.tasa.valueChanges, d.plazo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => d.pago.setValue(calcularPagoDiario(c.monto.value, c.tasa.value, d.plazo.value)));

    // ── Calculados de Semanal, Quincenal y Mensual ──
    const p = c.periodico.controls;

    // La fecha de inicio (primer pago) depende de la entrega y del día de pago.
    merge(c.fechaEntrega.valueChanges, p.diaPago.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => p.fechaInicio.setValue(calcularFechaInicio(c.fechaEntrega.value, p.diaPago.value)));

    /*
     * El plazo (número de pagos) depende de los meses y del tipo: meses × 4, × 2 o × 1.
     * Al cambiar de tipo, el plazo se vuelve a calcular y, en cadena, la fecha de término y el pago:
     * no quedan valores calculados con la fórmula del tipo anterior.
     */
    merge(p.meses.valueChanges, c.tipoPrestamo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => p.plazo.setValue(calcularNumeroPagos(p.meses.value, c.tipoPrestamo.value)));

    // La fecha de término depende de la fecha de inicio, del plazo y de los días entre pagos del tipo.
    merge(p.fechaInicio.valueChanges, p.plazo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() =>
        p.fechaTermino.setValue(calcularFechaTermino(p.fechaInicio.value, p.plazo.value, c.tipoPrestamo.value)),
      );

    // El pago depende del monto, la tasa, los meses y el plazo.
    merge(c.monto.valueChanges, c.tasa.valueChanges, p.meses.valueChanges, p.plazo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => p.pago.setValue(calcularPago(c.monto.value, c.tasa.value, p.meses.value, p.plazo.value)));
  }

  /** Habilita solo el grupo de campos del tipo elegido; el otro se deshabilita y no se valida. */
  private aplicarTipo(tipo: TipoPrestamo): void {
    const { diario, periodico } = this.form.controls.condiciones.controls;
    // enable() también habilita los calculados: se vuelven a dejar de solo lectura.
    if (tipo === 'Diario') {
      periodico.disable();
      diario.enable();
      const d = diario.controls;
      [d.plazo, d.pago].forEach(campo => campo.disable());
    } else {
      diario.disable();
      periodico.enable();
      const p = periodico.controls;
      [p.pago, p.plazo, p.fechaInicio, p.fechaTermino].forEach(campo => campo.disable());
    }
  }

  /** El campo tiene ese error y el usuario ya lo tocó (o intentó enviar). */
  protected tieneError(ruta: string, error: string): boolean {
    const control = this.form.get(ruta);
    return !!control && control.hasError(error) && (control.touched || control.dirty);
  }

  /**
   * Condiciones planas con todos los campos; los del grupo que no aplica al tipo elegido van en null.
   * Solo se llama con el formulario válido: monto y tasa ya no son null.
   */
  private condicionesParaEnviar(): CondicionesRegistro {
    const { tipoPrestamo, monto, tasa, fechaEntrega, diario, periodico } =
      this.form.controls.condiciones.getRawValue();
    return {
      tipoPrestamo,
      monto: monto as number,
      tasa: tasa as number,
      fechaEntrega,
      ...(tipoPrestamo === 'Diario' ? { ...SIN_DIA_PAGO_NI_MESES, ...diario } : periodico),
    };
  }

  /** Datos listos para enviar. Solo se llama con el formulario válido. */
  private datos(): DatosRegistro {
    const { cliente } = this.form.getRawValue();
    const condicionesDto = this.condicionesParaEnviar();
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
    // Con el formulario válido, pago y plazo ya están calculados; meses solo es null en Diario.
    const c = this.condicionesParaEnviar();
    const amortizaciones =
      c.tipoPrestamo === 'Diario'
        ? calcularAmortizacionesDiarias({ monto: c.monto, tasa: c.tasa, plazo: c.plazo!, fechaInicio: c.fechaInicio })
        : calcularAmortizaciones({
            tipo: c.tipoPrestamo,
            monto: c.monto,
            tasa: c.tasa,
            meses: c.meses!,
            plazo: c.plazo!,
            fechaInicio: c.fechaInicio,
          });
    this.amortizaciones.set(amortizaciones);
    this.resumen.set({
      plazo: c.plazo!,
      pago: c.pago!,
      diaPago: c.diaPago ?? 'Lunes a sábado',
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
