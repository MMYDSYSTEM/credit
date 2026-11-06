/* Tipos que envía y devuelve el backend de préstamos. */

export type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';

export type EstadoAmortizacion = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';

export type TipoPrestamo = 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual';

export interface Condiciones {
  monto: number;
  tasaMensual: number;
  tipoPrestamo: TipoPrestamo;
  dias: number | null; // solo en préstamos diarios: días que dura el préstamo
  diaPago: string;
  pago: number; // pago semanal
  plazo: number; // número de pagos semanales
  meses: number;
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
  fechaEntrega: string; // yyyy-MM-dd
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

/** Cliente nuevo: se crea junto con el préstamo. */
export interface RegistrarPrestamoClienteNuevo {
  cliente: ClienteNuevo;
  condiciones: Condiciones;
}

/** Cliente existente: el backend rechaza el alta si ya tiene un préstamo activo. */
export interface RegistrarPrestamoClienteExistente {
  clienteId: string;
  condiciones: Condiciones;
}

export type DatosRegistro = RegistrarPrestamoClienteNuevo | RegistrarPrestamoClienteExistente;

export interface PrestamoRegistrado {
  id: string;
  folio: string;
  clienteId: string;
}
