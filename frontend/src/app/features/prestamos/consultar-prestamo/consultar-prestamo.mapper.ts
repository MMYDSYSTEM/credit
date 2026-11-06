import { formatearFecha } from '../_shared/formato';
import {
  AmortizacionPrestamoDto,
  EstadoAmortizacion,
  EstadoPrestamo,
  PrestamoDto,
  TotalesPrestamoDto,
} from './consultar-prestamo.dto';

/*
 * DTO → modelo de vista. Solo presentación: formatea fechas, traduce estados
 * y ubica el próximo pago. Los montos se muestran tal como llegan del backend.
 */

export type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export interface AmortizacionVista {
  numero: number;
  fechaVencimiento: string; // dd/MM/yyyy
  pagoSemanal: number;
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
  monto: number;
  tasaMensual: number;
  diaPago: string;
  pago: number;
  plazo: number;
  meses: number;
  fechaEntrega: string;
  fechaInicio: string;
  fechaTermino: string;
  totales: TotalesPrestamoDto;
  amortizaciones: AmortizacionVista[];
}

const ESTADOS_PRESTAMO: Record<EstadoPrestamo, { etiqueta: string; severidad: Severidad }> = {
  ACTIVO: { etiqueta: 'Activo', severidad: 'success' },
  LIQUIDADO: { etiqueta: 'Liquidado', severidad: 'secondary' },
};

const ESTADOS_AMORTIZACION: Record<EstadoAmortizacion, { etiqueta: string; severidad: Severidad }> = {
  PAGADA: { etiqueta: 'Pagado', severidad: 'success' },
  PENDIENTE: { etiqueta: 'Pendiente', severidad: 'secondary' },
  VENCIDA: { etiqueta: 'Vencido', severidad: 'danger' },
};

function mapearAmortizacion(dto: AmortizacionPrestamoDto, esProxima: boolean): AmortizacionVista {
  const estado =
    esProxima && dto.estado === 'PENDIENTE'
      ? { etiqueta: 'Próximo', severidad: 'info' as const }
      : ESTADOS_AMORTIZACION[dto.estado];
  return {
    numero: dto.numero,
    fechaVencimiento: formatearFecha(dto.fechaVencimiento),
    pagoSemanal: dto.capital + dto.interes + dto.gastos,
    capital: dto.capital,
    interes: dto.interes,
    gastos: dto.gastos,
    etiqueta: estado.etiqueta,
    severidad: estado.severidad,
    esProxima,
  };
}

export function mapearPrestamo(dto: PrestamoDto): PrestamoVista {
  const proxima = dto.amortizaciones.find(a => a.estado === 'VENCIDA' || a.estado === 'PENDIENTE') ?? null;
  const { cliente, condiciones: c } = dto;
  const estado = ESTADOS_PRESTAMO[dto.estado];

  return {
    id: dto.id,
    folio: dto.folio,
    estadoEtiqueta: estado.etiqueta,
    estadoSeveridad: estado.severidad,
    clienteId: cliente.id,
    clienteNombre: [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' '),
    monto: c.monto,
    tasaMensual: c.tasaMensual,
    diaPago: c.diaPago,
    pago: c.pago,
    plazo: c.plazo,
    meses: c.meses,
    fechaEntrega: formatearFecha(c.fechaEntrega),
    fechaInicio: formatearFecha(c.fechaInicio),
    fechaTermino: formatearFecha(c.fechaTermino),
    totales: dto.totales,
    amortizaciones: dto.amortizaciones.map(a => mapearAmortizacion(a, a === proxima)),
  };
}
