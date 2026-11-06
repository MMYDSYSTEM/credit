import {
  calcularAmortizaciones,
  calcularFechaInicio,
  calcularFechaTermino,
  calcularNumeroPagos,
  calcularPago,
  fechaDeHoy,
} from './prestamo.calculos';

describe('prestamo.calculos', () => {
  it('fechaDeHoy usa la fecha local en yyyy-MM-dd', () => {
    expect(fechaDeHoy(new Date(2026, 10, 6, 23, 30))).toBe('2026-11-06');
  });

  describe('calcularFechaInicio', () => {
    it('toma el primer día de cobro al menos 7 días después de la entrega', () => {
      // Martes 10/11 + 7 = martes 17/11 → siguiente lunes 23/11.
      expect(calcularFechaInicio('2026-11-10', 'Lunes')).toBe('2026-11-23');
    });

    it('si la entrega es el mismo día de cobro, el primer pago es 7 días después', () => {
      expect(calcularFechaInicio('2026-11-09', 'Lunes')).toBe('2026-11-16');
    });

    it('devuelve vacío con datos incompletos', () => {
      expect(calcularFechaInicio('', 'Lunes')).toBe('');
      expect(calcularFechaInicio('2026-11-10', 'Domingox')).toBe('');
    });
  });

  it('calcularNumeroPagos: 4 pagos por mes', () => {
    expect(calcularNumeroPagos(4)).toBe(16);
    expect(calcularNumeroPagos(null)).toBeNull();
    expect(calcularNumeroPagos(0)).toBeNull();
  });

  it('calcularFechaTermino: inicio + (plazo − 1) semanas', () => {
    expect(calcularFechaTermino('2026-11-23', 16)).toBe('2027-03-08');
    expect(calcularFechaTermino('2026-11-23', null)).toBe('');
  });

  it('calcularPago: 5000 al 15 % mensual por 4 meses → 500 semanales', () => {
    expect(calcularPago(5000, 15, 4, 16)).toBe(500);
    expect(calcularPago(null, 15, 4, 16)).toBeNull();
  });

  it('calcularAmortizaciones: una fila por semana con capital e interés', () => {
    const filas = calcularAmortizaciones({
      monto: 5000,
      tasaMensual: 15,
      meses: 4,
      plazo: 16,
      fechaInicio: '2026-11-23',
    });
    expect(filas).toHaveLength(16);
    expect(filas[0]).toEqual({ numero: 1, fecha: '23/11/2026', pago: 500, capital: 312.5, interes: 187.5, gastos: 0 });
    expect(filas[15].fecha).toBe('08/03/2027');
  });
});
