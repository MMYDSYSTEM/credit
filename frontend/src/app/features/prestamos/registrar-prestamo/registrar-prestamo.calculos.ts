/*
 * Valores derivados del formulario "Generar Préstamo" (pagos semanales).
 * Las fechas viajan como texto 'yyyy-MM-dd'. Para operar con ellas se usa la fecha LOCAL
 * (new Date(año, mes, día) y getDay/getDate), nunca toISOString(), que convierte a UTC
 * y en México por la noche daría el día siguiente.
 */

import { formatearFecha } from '../_shared/formato';

const DIAS_SEMANA =['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Pagos semanales por mes: 4 meses → 16 pagos. */
export const PAGOS_POR_MES = 4;

function aTexto(fecha: Date): string {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

function desdeTexto(fecha: string): Date | null {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return anio && mes && dia ? new Date(anio, mes - 1, dia) : null;
}

/** Fecha de hoy en 'yyyy-MM-dd' (local, sin desfase UTC). */
export function fechaDeHoy(hoy: Date = new Date()): string {
  return aTexto(hoy);
}

/** Días mínimos entre la entrega del dinero y el primer pago. */
export const DIAS_MINIMOS_PRIMER_PAGO = 7;

/**
 * Fecha de inicio = primer pago: el primer `dia` de cobro que cae al menos
 * DIAS_MINIMOS_PRIMER_PAGO días después de la entrega (pueden pasar hasta 13 días).
 * Los pagos siguientes caen cada semana en ese mismo día.
 */
export function calcularFechaInicio(fechaEntrega: string, dia: string): string {
  const entrega = desdeTexto(fechaEntrega);
  const objetivo = DIAS_SEMANA.indexOf(dia);
  if (!entrega || objetivo < 0) {
    return '';
  }
  const minimo = new Date(entrega.getFullYear(), entrega.getMonth(), entrega.getDate() + DIAS_MINIMOS_PRIMER_PAGO);
  const diasHasta = (objetivo - minimo.getDay() + 7) % 7;
  return aTexto(new Date(minimo.getFullYear(), minimo.getMonth(), minimo.getDate() + diasHasta));
}

/** Número de pagos semanales para un plazo en meses. */
export function calcularNumeroPagos(meses: number | null): number | null {
  return meses && meses > 0 ? meses * PAGOS_POR_MES : null;
}

/** Fecha del último pago: inicio + (plazo − 1) semanas. */
export function calcularFechaTermino(fechaInicio: string, plazo: number | null): string {
  const inicio = desdeTexto(fechaInicio);
  if (!inicio || !plazo || plazo < 1) {
    return '';
  }
  return aTexto(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + (plazo - 1) * 7));
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/** Fila de la tabla de amortización proyectada (vista previa antes de guardar). */
export interface AmortizacionProyectada {
  numero: number;
  fecha: string; // dd/MM/yyyy
  pago: number;
  capital: number;
  interes: number;
  gastos: number;
}

/**
 * Amortizaciones semanales proyectadas, con interés simple sobre el monto:
 * capital = monto / plazo; interés = monto × tasa × meses / plazo. Una por semana desde la fecha de inicio.
 */
export function calcularAmortizaciones(c: {
  monto: number;
  tasaMensual: number;
  meses: number;
  plazo: number;
  fechaInicio: string;
}): AmortizacionProyectada[] {
  const inicio = desdeTexto(c.fechaInicio);
  if (!inicio || !c.monto || !c.plazo || !c.meses) {
    return [];
  }
  const capital = redondear(c.monto / c.plazo);
  const interes = redondear((c.monto * (c.tasaMensual / 100) * c.meses) / c.plazo);
  return Array.from({ length: c.plazo }, (_, i) => ({
    numero: i + 1,
    fecha: formatearFecha(aTexto(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i * 7))),
    pago: redondear(capital + interes),
    capital,
    interes,
    gastos: 0,
  }));
}

/**
 * Pago semanal con interés simple sobre el monto:
 * capital = monto / plazo; interés = monto × tasa × meses / plazo; pago = capital + interés.
 * Se redondea a centavos.
 */
export function calcularPago(
  monto: number | null,
  tasaMensual: number | null,
  meses: number | null,
  plazo: number | null,
): number | null {
  if (!monto || tasaMensual === null || !meses || !plazo) {
    return null;
  }
  const interesTotal = monto * (tasaMensual / 100) * meses;
  return Math.round(((monto + interesTotal) / plazo) * 100) / 100;
}
