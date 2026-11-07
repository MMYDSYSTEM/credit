/* Tipos que envía y devuelve el backend de préstamos. */

export type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';

export type EstadoAmortizacion = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';

export type TipoPrestamo = 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual';

export interface Condiciones {
  tipoPrestamo: TipoPrestamo;
  monto: number;
  tasa: number;
  diaPago: string | null; // null en Diario (se cobra de lunes a sábado)
  pago: number; // pago por periodo
  plazo: number; // número de pagos (en Diario, días sin contar domingos)
  meses: number | null; // null en Diario
  fechaEntrega: string; // yyyy-MM-dd
  fechaInicio: string; // yyyy-MM-dd
  fechaTermino: string; // yyyy-MM-dd
}

// ── GET /api/prestamos/{id} ──────────────────────────────────────────────

export interface ClientePrestamo {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
}

export interface TotalesPrestamo {
  capital: number;
  interes: number;
  gastos: number;
  total: number;
}

export interface AmortizacionPrestamo {
  numero: number;
  fechaVencimiento: string; // yyyy-MM-dd
  capital: number;
  interes: number;
  gastos: number;
  estado: EstadoAmortizacion;
}

export interface Prestamo {
  id: string;
  folio: string;
  estado: EstadoPrestamo;
  cliente: ClientePrestamo;
  condiciones: Condiciones;
  totales: TotalesPrestamo;
  amortizaciones: AmortizacionPrestamo[];
}

// ── GET /api/clientes/{id}/prestamos ─────────────────────────────────────

export interface PrestamoResumen {
  id: string;
  folio: string;
  monto: number;
  pago: number;
  plazo: number;
  fechaInicio: string; // yyyy-MM-dd: primer pago
  fechaTermino: string; // yyyy-MM-dd
  estado: EstadoPrestamo;
}

export interface PrestamosDeCliente {
  cliente: { id: string; nombreCompleto: string };
  prestamos: PrestamoResumen[];
}

// ── GET /api/clientes/{id} ───────────────────────────────────────────────

export interface ClienteExistente {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
  prestamoActivo: { id: string; folio: string } | null;
}

// ── POST /api/prestamos ──────────────────────────────────────────────────

export interface ClienteNuevo {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null; // opcional
}

/**
 * Condiciones capturadas al generar un préstamo. Siempre se envían todos los campos:
 * los que dependen del tipo de préstamo van en null cuando no aplican.
 */
export interface CondicionesRegistro {
  // Capturados en todos los tipos
  tipoPrestamo: TipoPrestamo;
  monto: number;
  tasa: number; // porcentaje por periodo del tipo de préstamo (en Diario, sobre el monto y repartido entre los días)
  fechaEntrega: string; // yyyy-MM-dd

  // Todos los tipos; en Diario las fechas se capturan, en los demás se calculan
  fechaInicio: string; // yyyy-MM-dd: primer pago
  fechaTermino: string; // yyyy-MM-dd: último pago
  pago: number | null;
  plazo: number | null; // número de pagos (en Diario, días sin contar domingos)

  // Solo Semanal, Quincenal y Mensual (null en Diario)
  diaPago: string | null;
  meses: number | null;
}

/** Cliente nuevo: se crea junto con el préstamo. */
export interface RegistrarPrestamoClienteNuevo {
  cliente: ClienteNuevo;
  condiciones: CondicionesRegistro;
}

/** Cliente existente: el backend rechaza el alta si ya tiene un préstamo activo. */
export interface RegistrarPrestamoClienteExistente {
  clienteId: string;
  condiciones: CondicionesRegistro;
}

export type DatosRegistro = RegistrarPrestamoClienteNuevo | RegistrarPrestamoClienteExistente;

export interface PrestamoRegistrado {
  id: string;
  folio: string;
  clienteId: string;
}
