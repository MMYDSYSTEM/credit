import { formatearFecha } from './formato';
import {
  AmortizacionPrestamo,
  EstadoAmortizacion,
  EstadoPrestamo,
  Prestamo,
  PrestamosDeCliente,
  TipoPrestamo,
  TotalesPrestamo,
} from './prestamo.model';

/*
 * Respuesta del backend → modelo de vista. Solo presentación: formatea fechas, traduce estados
 * y ubica el próximo pago. Los montos se muestran tal como llegan del backend.
 */

export type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface EstadoVista {
  etiqueta: string;
  severidad: Severidad;
}

const ESTADOS_PRESTAMO: Record<EstadoPrestamo, EstadoVista> = {
  ACTIVO: { etiqueta: 'Activo', severidad: 'success' },
  LIQUIDADO: { etiqueta: 'Liquidado', severidad: 'secondary' },
};

const ESTADOS_AMORTIZACION: Record<EstadoAmortizacion, EstadoVista> = {
  PAGADA: { etiqueta: 'Pagado', severidad: 'success' },
  PENDIENTE: { etiqueta: 'Pendiente', severidad: 'secondary' },
  VENCIDA: { etiqueta: 'Vencido', severidad: 'danger' },
};

// ── Detalle de un préstamo ───────────────────────────────────────────────

export interface AmortizacionVista {
  numero: number;
  fechaVencimiento: string; // dd/MM/yyyy
  pago: number;
  capital: number;
  interes: number;
  gastos: number;
  etiqueta: string;
  severidad: Severidad;
  esProxima: boolean;
}

export interface PrestamoVista {
  id: string;
  folio: string;
  estadoEtiqueta: string;
  estadoSeveridad: Severidad;
  clienteId: string;
  clienteNombre: string;
  tipoPrestamo: TipoPrestamo;
  monto: number;
  /** "15 % mensual" o, en Diario, "15 % sobre el monto". */
  tasaTexto: string;
  /** "Lunes" o, en Diario, "Lunes a sábado". */
  diasCobro: string;
  /** "Pago Semanal", "Pago Diario"… */
  tituloPago: string;
  /** "semanal", "diario"… */
  periodoPago: string;
  pago: number;
  plazo: number;
  /** "4 meses"; null en Diario (solo se muestra el total de pagos). */
  plazoTexto: string | null;
  fechaEntrega: string;
  fechaInicio: string;
  fechaTermino: string;
  totales: TotalesPrestamo;
  amortizaciones: AmortizacionVista[];
}

function mapearAmortizacion(dto: AmortizacionPrestamo, esProxima: boolean): AmortizacionVista {
  const estado =
    esProxima && dto.estado === 'PENDIENTE'
      ? { etiqueta: 'Próximo', severidad: 'info' as const }
      : ESTADOS_AMORTIZACION[dto.estado];
  return {
    numero: dto.numero,
    fechaVencimiento: formatearFecha(dto.fechaVencimiento),
    pago: dto.capital + dto.interes + dto.gastos,
    capital: dto.capital,
    interes: dto.interes,
    gastos: dto.gastos,
    etiqueta: estado.etiqueta,
    severidad: estado.severidad,
    esProxima,
  };
}

export function mapearPrestamo(dto: Prestamo): PrestamoVista {
  const proxima = dto.amortizaciones.find(a => a.estado === 'VENCIDA' || a.estado === 'PENDIENTE') ?? null;
  const { cliente, condiciones: c } = dto;
  const estado = ESTADOS_PRESTAMO[dto.estado];
  const esDiario = c.tipoPrestamo === 'Diario';

  return {
    id: dto.id,
    folio: dto.folio,
    estadoEtiqueta: estado.etiqueta,
    estadoSeveridad: estado.severidad,
    clienteId: cliente.id,
    clienteNombre: [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' '),
    tipoPrestamo: c.tipoPrestamo,
    monto: c.monto,
    tasaTexto: esDiario ? `${c.tasa} % sobre el monto` : `${c.tasa} % mensual`,
    diasCobro: esDiario ? 'Lunes a sábado' : (c.diaPago ?? ''),
    tituloPago: `Pago ${c.tipoPrestamo}`,
    periodoPago: c.tipoPrestamo.toLowerCase(),
    pago: c.pago,
    plazo: c.plazo,
    plazoTexto: esDiario ? null : `${c.meses} meses`,
    fechaEntrega: formatearFecha(c.fechaEntrega),
    fechaInicio: formatearFecha(c.fechaInicio),
    fechaTermino: formatearFecha(c.fechaTermino),
    totales: dto.totales,
    amortizaciones: dto.amortizaciones.map(a => mapearAmortizacion(a, a === proxima)),
  };
}

// ── Préstamos de un cliente ──────────────────────────────────────────────

export interface PrestamoFilaVista {
  id: string;
  folio: string;
  monto: number;
  pago: number;
  plazo: number;
  fechaInicio: string; // dd/MM/yyyy
  fechaTermino: string; // dd/MM/yyyy
  estadoEtiqueta: string;
  estadoSeveridad: Severidad;
}

export interface PrestamosDeClienteVista {
  clienteId: string;
  clienteNombre: string;
  prestamos: PrestamoFilaVista[];
}

export function mapearPrestamosDeCliente(dto: PrestamosDeCliente): PrestamosDeClienteVista {
  return {
    clienteId: dto.cliente.id,
    clienteNombre: dto.cliente.nombreCompleto,
    prestamos: dto.prestamos.map(p => ({
      id: p.id,
      folio: p.folio,
      monto: p.monto,
      pago: p.pago,
      plazo: p.plazo,
      fechaInicio: formatearFecha(p.fechaInicio),
      fechaTermino: formatearFecha(p.fechaTermino),
      estadoEtiqueta: ESTADOS_PRESTAMO[p.estado].etiqueta,
      estadoSeveridad: ESTADOS_PRESTAMO[p.estado].severidad,
    })),
  };
}
