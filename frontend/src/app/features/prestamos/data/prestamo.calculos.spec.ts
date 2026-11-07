import {
  calcularAmortizaciones,
  calcularAmortizacionesDiarias,
  calcularFechaInicio,
  calcularFechaTermino,
  calcularNumeroPagos,
  calcularInicioDiario,
  calcularPago,
  calcularPagoDiario,
  calcularPlazoDiario,
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

  describe('Semanal, Quincenal y Mensual', () => {
    it('calcularNumeroPagos: meses × 4, × 2 o × 1; null en Diario', () => {
      expect(calcularNumeroPagos(4, 'Semanal')).toBe(16);
      expect(calcularNumeroPagos(4, 'Quincenal')).toBe(8);
      expect(calcularNumeroPagos(4, 'Mensual')).toBe(4);
      expect(calcularNumeroPagos(4, 'Diario')).toBeNull();
      expect(calcularNumeroPagos(null, 'Semanal')).toBeNull();
      expect(calcularNumeroPagos(0, 'Semanal')).toBeNull();
    });

    it('calcularFechaTermino: inicio + (plazo − 1) × 7, 14 o 28 días', () => {
      expect(calcularFechaTermino('2026-11-23', 16, 'Semanal')).toBe('2027-03-08');
      expect(calcularFechaTermino('2026-11-23', 8, 'Quincenal')).toBe('2027-03-01'); // 7 × 14 = 98 días
      expect(calcularFechaTermino('2026-11-23', 4, 'Mensual')).toBe('2027-02-15'); // 3 × 28 = 84 días
      expect(calcularFechaTermino('2026-11-23', 16, 'Diario')).toBe('');
      expect(calcularFechaTermino('2026-11-23', null, 'Semanal')).toBe('');
    });

    it('calcularPago: (monto + monto × tasa × meses) ÷ plazo', () => {
      // 2000 al 15 % mensual por 2 meses: 600 de interés, 2600 en total.
      expect(calcularPago(2000, 15, 2, 8)).toBe(325); // Semanal: 8 pagos
      expect(calcularPago(2000, 15, 2, 4)).toBe(650); // Quincenal: 4 pagos
      expect(calcularPago(2000, 15, 2, 2)).toBe(1300); // Mensual: 2 pagos
      expect(calcularPago(5000, 15, 4, 16)).toBe(500);
      expect(calcularPago(null, 15, 4, 16)).toBeNull();
    });

    it('calcularAmortizaciones Semanal: una fila por semana con capital e interés', () => {
      const filas = calcularAmortizaciones({
        tipo: 'Semanal',
        monto: 5000,
        tasa: 15,
        meses: 4,
        plazo: 16,
        fechaInicio: '2026-11-23',
      });
      expect(filas).toHaveLength(16);
      expect(filas[0]).toEqual({ numero: 1, fecha: '23/11/2026', pago: 500, capital: 312.5, interes: 187.5, gastos: 0 });
      expect(filas[15].fecha).toBe('08/03/2027');
    });

    it('calcularAmortizaciones Quincenal y Mensual: cada 14 y 28 días, mismo día de la semana', () => {
      const quincenal = calcularAmortizaciones({
        tipo: 'Quincenal',
        monto: 2000,
        tasa: 15,
        meses: 2,
        plazo: 4,
        fechaInicio: '2026-11-23',
      });
      expect(quincenal.map(f => f.fecha)).toEqual(['23/11/2026', '07/12/2026', '21/12/2026', '04/01/2027']);
      expect(quincenal[0]).toMatchObject({ pago: 650, capital: 500, interes: 150 });

      const mensual = calcularAmortizaciones({
        tipo: 'Mensual',
        monto: 2000,
        tasa: 15,
        meses: 2,
        plazo: 2,
        fechaInicio: '2026-11-23',
      });
      expect(mensual.map(f => f.fecha)).toEqual(['23/11/2026', '21/12/2026']);
      expect(mensual[0]).toMatchObject({ pago: 1300, capital: 1000, interes: 300 });
    });
  });

  describe('préstamo diario', () => {
    it('calcularInicioDiario: día siguiente a la entrega; si cae en domingo, el lunes', () => {
      expect(calcularInicioDiario('2026-11-10')).toBe('2026-11-11'); // martes → miércoles
      expect(calcularInicioDiario('2026-11-14')).toBe('2026-11-16'); // sábado → (domingo) → lunes
      expect(calcularInicioDiario('')).toBe('');
    });

    it('calcularPlazoDiario: cuenta inicio y fin, sin domingos', () => {
      // Lunes 09/11 a sábado 21/11: 13 días, menos el domingo 15 = 12.
      expect(calcularPlazoDiario('2026-11-09', '2026-11-21')).toBe(12);
      // Lunes 09/11 a lunes 23/11: 15 días, menos los domingos 15 y 22 = 13.
      expect(calcularPlazoDiario('2026-11-09', '2026-11-23')).toBe(13);
      expect(calcularPlazoDiario('2026-11-09', '2026-11-09')).toBe(1);
    });

    it('calcularPlazoDiario: null con fechas incompletas, invertidas o solo domingos', () => {
      expect(calcularPlazoDiario('', '2026-11-21')).toBeNull();
      expect(calcularPlazoDiario('2026-11-21', '2026-11-09')).toBeNull();
      expect(calcularPlazoDiario('2026-11-15', '2026-11-15')).toBeNull();
    });

    it('calcularPagoDiario: (monto + monto × tasa) ÷ plazo', () => {
      // 2000 al 15 % = 300 de interés; en 10 días: 200 de capital + 30 de interés = 230 diarios.
      expect(calcularPagoDiario(2000, 15, 10)).toBe(230);
      // (1000 + 150) / 12 = 95.8333… → 95.83
      expect(calcularPagoDiario(1000, 15, 12)).toBe(95.83);
      expect(calcularPagoDiario(null, 10, 20)).toBeNull();
      expect(calcularPagoDiario(1000, 10, null)).toBeNull();
    });

    it('calcularAmortizacionesDiarias: una fila por día de cobro, saltando domingos', () => {
      // 2000 al 15 % en 10 días desde el viernes 13/11: 200 de capital + 30 de interés = 230.
      const filas = calcularAmortizacionesDiarias({ monto: 2000, tasa: 15, plazo: 10, fechaInicio: '2026-11-13' });
      expect(filas).toHaveLength(10);
      expect(filas[0]).toEqual({ numero: 1, fecha: '13/11/2026', pago: 230, capital: 200, interes: 30, gastos: 0 });
      expect(filas[1].fecha).toBe('14/11/2026'); // sábado
      expect(filas[2].fecha).toBe('16/11/2026'); // el domingo 15 no se cobra
      expect(filas[9].fecha).toBe('24/11/2026');
      expect(filas.reduce((total, f) => total + f.pago, 0)).toBe(2300);
    });

    it('calcularAmortizacionesDiarias: vacío con datos incompletos', () => {
      expect(calcularAmortizacionesDiarias({ monto: 2000, tasa: 15, plazo: 0, fechaInicio: '2026-11-13' })).toEqual([]);
      expect(calcularAmortizacionesDiarias({ monto: 2000, tasa: 15, plazo: 10, fechaInicio: '' })).toEqual([]);
    });
  });
});
