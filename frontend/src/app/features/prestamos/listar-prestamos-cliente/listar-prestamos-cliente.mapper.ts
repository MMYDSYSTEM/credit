import { formatearFecha } from '../_shared/formato';
import { EstadoPrestamo, PrestamosDeClienteDto } from './listar-prestamos-cliente.dto';

/* DTO → modelo de vista: formatea fechas y traduce el estado. */

export type Severidad = 'success' | 'secondary';

export interface PrestamoFilaVista {
  id: string;
  folio: string;
  monto: number;
  pago: number;
  plazo: number;
  fechaEntrega: string; // dd/MM/yyyy
  fechaTermino: string; // dd/MM/yyyy
  estadoEtiqueta: string;
  estadoSeveridad: Severidad;
}

export interface PrestamosDeClienteVista {
  clienteId: string;
  clienteNombre: string;
  prestamos: PrestamoFilaVista[];
}

const ESTADOS: Record<EstadoPrestamo, { etiqueta: string; severidad: Severidad }> = {
  ACTIVO: { etiqueta: 'Activo', severidad: 'success' },
  LIQUIDADO: { etiqueta: 'Liquidado', severidad: 'secondary' },
};

export function mapearPrestamosDeCliente(dto: PrestamosDeClienteDto): PrestamosDeClienteVista {
  return {
    clienteId: dto.cliente.id,
    clienteNombre: dto.cliente.nombreCompleto,
    prestamos: dto.prestamos.map(p => ({
      id: p.id,
      folio: p.folio,
      monto: p.monto,
      pago: p.pago,
      plazo: p.plazo,
      fechaEntrega: formatearFecha(p.fechaEntrega),
      fechaTermino: formatearFecha(p.fechaTermino),
      estadoEtiqueta: ESTADOS[p.estado].etiqueta,
      estadoSeveridad: ESTADOS[p.estado].severidad,
    })),
  };
}
