/*
 * Valores derivados del formulario "Generar Préstamo".
 * Las fechas viajan como texto 'yyyy-MM-dd'. Para operar con ellas se usa la fecha LOCAL
 * (new Date(año, mes, día) y getDay/getDate), nunca toISOString(), que convierte a UTC
 * y en México por la noche daría el día siguiente.
 */

import { formatearFecha } from './formato';
import { TipoPrestamo } from './prestamo.model';

const DIAS_SEMANA =['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Tipos con día de pago y meses: todos menos Diario. */
export type TipoPeriodico = Exclude<TipoPrestamo, 'Diario'>;

/** Pagos por mes de cada tipo: un mes tiene 4 semanas o 2 quincenas. */
export const PAGOS_POR_MES: Record<TipoPeriodico, number> = { Semanal: 4, Quincenal: 2, Mensual: 1 };

/** Días entre un pago y el siguiente: así cada pago cae en el mismo día de la semana. */
export const DIAS_ENTRE_PAGOS: Record<TipoPeriodico, number> = { Semanal: 7, Quincenal: 14, Mensual: 28 };

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
 * Los pagos siguientes caen en ese mismo día de la semana (cada 7, 14 o 28 días según el tipo).
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

/** Número de pagos para un plazo en meses: meses × 4 (Semanal), × 2 (Quincenal) o × 1 (Mensual). null en Diario. */
export function calcularNumeroPagos(meses: number | null, tipo: TipoPrestamo): number | null {
  if (tipo === 'Diario' || !meses || meses <= 0) {
    return null;
  }
  return meses * PAGOS_POR_MES[tipo];
}

/** Fecha del último pago: inicio + (plazo − 1) × días entre pagos del tipo. Vacía en Diario. */
export function calcularFechaTermino(fechaInicio: string, plazo: number | null, tipo: TipoPrestamo): string {
  const inicio = desdeTexto(fechaInicio);
  if (tipo === 'Diario' || !inicio || !plazo || plazo < 1) {
    return '';
  }
  const dias = (plazo - 1) * DIAS_ENTRE_PAGOS[tipo];
  return aTexto(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + dias));
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
 * Amortizaciones proyectadas de Semanal, Quincenal y Mensual, con interés simple sobre el monto:
 * capital = monto / plazo; interés = monto × tasa × meses / plazo.
 * Una cada 7, 14 o 28 días (según el tipo) desde la fecha de inicio.
 */
export function calcularAmortizaciones(c: {
  tipo: TipoPeriodico;
  monto: number;
  tasa: number;
  meses: number;
  plazo: number;
  fechaInicio: string;
}): AmortizacionProyectada[] {
  const inicio = desdeTexto(c.fechaInicio);
  if (!inicio || !c.monto || !c.plazo || !c.meses) {
    return [];
  }
  const capital = redondear(c.monto / c.plazo);
  const interes = redondear((c.monto * (c.tasa / 100) * c.meses) / c.plazo);
  return Array.from({ length: c.plazo }, (_, i) => ({
    numero: i + 1,
    fecha: formatearFecha(
      aTexto(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i * DIAS_ENTRE_PAGOS[c.tipo])),
    ),
    pago: redondear(capital + interes),
    capital,
    interes,
    gastos: 0,
  }));
}

/**
 * Pago de Semanal, Quincenal y Mensual con interés simple sobre el monto:
 * capital = monto / plazo; interés = monto × tasa × meses / plazo; pago = capital + interés.
 * Se redondea a centavos.
 */
export function calcularPago(
  monto: number | null,
  tasa: number | null,
  meses: number | null,
  plazo: number | null,
): number | null {
  if (!monto || tasa === null || !meses || !plazo) {
    return null;
  }
  const interesTotal = monto * (tasa / 100) * meses;
  return Math.round(((monto + interesTotal) / plazo) * 100) / 100;
}

// ── Préstamo diario: se cobra de lunes a sábado; los domingos no cuentan ──

const DOMINGO = 0;

/** Primer día de cobro de un préstamo diario: el día siguiente a la entrega; si es domingo, el lunes. */
export function calcularInicioDiario(fechaEntrega: string): string {
  const entrega = desdeTexto(fechaEntrega);
  if (!entrega) {
    return '';
  }
  const inicio = new Date(entrega.getFullYear(), entrega.getMonth(), entrega.getDate() + 1);
  if (inicio.getDay() === DOMINGO) {
    inicio.setDate(inicio.getDate() + 1);
  }
  return aTexto(inicio);
}

/**
 * Plazo de un préstamo diario: días entre inicio y fin, ambos incluidos, sin contar domingos.
 * null si falta una fecha, el fin es anterior al inicio o el rango solo tiene domingos.
 */
export function calcularPlazoDiario(fechaInicio: string, fechaFin: string): number | null {
  const inicio = desdeTexto(fechaInicio);
  const fin = desdeTexto(fechaFin);
  if (!inicio || !fin || fin < inicio) {
    return null;
  }
  let dias = 0;
  for (const dia = new Date(inicio); dia <= fin; dia.setDate(dia.getDate() + 1)) {
    if (dia.getDay() !== DOMINGO) {
      dias++;
    }
  }
  return dias > 0 ? dias : null;
}

/**
 * Amortizaciones diarias proyectadas: una por día de cobro (lunes a sábado) desde la fecha de inicio.
 * capital = monto ÷ plazo; interés = monto × tasa ÷ plazo (el interés total se reparte entre los días).
 */
export function calcularAmortizacionesDiarias(c: {
  monto: number;
  tasa: number;
  plazo: number;
  fechaInicio: string;
}): AmortizacionProyectada[] {
  const inicio = desdeTexto(c.fechaInicio);
  if (!inicio || !c.monto || !c.plazo) {
    return [];
  }
  const capital = redondear(c.monto / c.plazo);
  const interes = redondear((c.monto * (c.tasa / 100)) / c.plazo);
  const filas: AmortizacionProyectada[] = [];
  for (const dia = new Date(inicio); filas.length < c.plazo; dia.setDate(dia.getDate() + 1)) {
    if (dia.getDay() !== DOMINGO) {
      filas.push({
        numero: filas.length + 1,
        fecha: formatearFecha(aTexto(dia)),
        pago: redondear(capital + interes),
        capital,
        interes,
        gastos: 0,
      });
    }
  }
  return filas;
}

/**
 * Pago diario con interés simple sobre el monto, repartido entre los días de pago:
 * interés total = monto × tasa; pago = (monto + interés total) ÷ plazo.
 * Ejemplo: 2000 al 15 % en 10 días → capital 200 + interés 30 = 230 diarios.
 * Se redondea a centavos.
 */
export function calcularPagoDiario(
  monto: number | null,
  tasa: number | null,
  plazo: number | null,
): number | null {
  if (!monto || tasa === null || !plazo) {
    return null;
  }
  const interesTotal = monto * (tasa / 100);
  return redondear((monto + interesTotal) / plazo);
}
