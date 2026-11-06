import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { Observable, map, mergeMap, throwError, timer } from 'rxjs';

/*
 * Backend simulado de /api/clientes y /api/prestamos, solo para desarrollo (environment.mockApi).
 * Es compartido porque los clientes que se crean al generar un préstamo deben aparecer en la lista de clientes.
 * Guarda el estado en memoria del navegador; recargar la página lo reinicia.
 * Tiene sus propios tipos y cálculos para no depender de ningún feature.
 *
 *   GET  /api/clientes                  lista de clientes (los más recientes primero) con su número de préstamos
 *                                       y su préstamo activo (si tiene)
 *   GET  /api/clientes/{id}             datos de un cliente y su préstamo activo (si tiene)
 *   GET  /api/clientes/{id}/prestamos   préstamos de un cliente
 *   POST /api/prestamos                 crea un préstamo: { cliente, condiciones } para un cliente nuevo
 *                                       o { clienteId, condiciones } para uno existente sin préstamo activo
 *   GET  /api/prestamos/{id}            detalle de un préstamo con sus amortizaciones
 */

type EstadoPrestamo = 'ACTIVO' | 'LIQUIDADO';
type EstadoAmortizacion = 'PAGADA' | 'PENDIENTE' | 'VENCIDA';

interface ClienteMock {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string | null;
  /** Orden de alta: mayor = más reciente. */
  registro: number;
}

interface CondicionesMock {
  monto: number;
  tasaMensual: number;
  diaPago: string;
  pago: number;
  plazo: number;
  meses: number;
  fechaEntrega: string;
  fechaInicio: string;
  fechaTermino: string;
}

interface AmortizacionMock {
  numero: number;
  fechaVencimiento: string;
  capital: number;
  interes: number;
  gastos: number;
  estado: EstadoAmortizacion;
}

interface PrestamoMock {
  id: string;
  folio: string;
  clienteId: string;
  estado: EstadoPrestamo;
  condiciones: CondicionesMock;
  amortizaciones: AmortizacionMock[];
}

const RETRASO_MS = 300;

// ---- Cálculos (interés simple sobre el monto) ----

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const f = new Date(anio, mes - 1, dia + dias); // fecha local, sin desfase UTC
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

function crearAmortizaciones(c: CondicionesMock, pagadas = 0): AmortizacionMock[] {
  const capital = redondear(c.monto / c.plazo);
  const interes = redondear((c.monto * (c.tasaMensual / 100) * c.meses) / c.plazo);
  return Array.from({ length: c.plazo }, (_, i) => ({
    numero: i + 1,
    fechaVencimiento: sumarDias(c.fechaInicio, i * 7),
    capital,
    interes,
    gastos: 0,
    estado: i < pagadas ? 'PAGADA' : 'PENDIENTE',
  }));
}

// ---- Datos iniciales ----

const CLIENTES_INICIALES: [string, string, string, string][] = [
  ['Ana', 'Torres', 'Ruiz', 'ana.torres@mail.com'],
  ['Luis', 'Gómez', 'Herrera', 'luis.gomez@mail.com'],
  ['María', 'Pérez', 'Castillo', 'maria.perez@mail.com'],
  ['Jorge', 'Ramírez', 'Ortiz', 'jorge.ramirez@mail.com'],
  ['Sofía', 'Hernández', 'López', 'sofia.hernandez@mail.com'],
  ['Carlos', 'Mendoza', 'Vega', 'carlos.mendoza@mail.com'],
  ['Lucía', 'Flores', 'Navarro', 'lucia.flores@mail.com'],
  ['Miguel', 'Sánchez', 'Rojas', 'miguel.sanchez@mail.com'],
  ['Valeria', 'Cruz', 'Morales', 'valeria.cruz@mail.com'],
  ['Diego', 'Martínez', 'Silva', 'diego.martinez@mail.com'],
  ['Camila', 'Reyes', 'Guerrero', 'camila.reyes@mail.com'],
  ['Andrés', 'Vargas', 'Medina', 'andres.vargas@mail.com'],
];

const clientes: ClienteMock[] = CLIENTES_INICIALES.map(([nombre, apellidoPaterno, apellidoMaterno, email], i) => ({
  id: `cliente-${i + 1}`,
  nombre,
  apellidoPaterno,
  apellidoMaterno,
  email,
  registro: -i, // los iniciales conservan su orden; los nuevos (registro > 0) van primero
}));

function crearPrestamo(
  folio: string,
  clienteId: string,
  condiciones: CondicionesMock,
  pagadas = 0,
): PrestamoMock {
  const amortizaciones = crearAmortizaciones(condiciones, pagadas);
  return {
    id: folio,
    folio,
    clienteId,
    estado: pagadas >= condiciones.plazo ? 'LIQUIDADO' : 'ACTIVO',
    condiciones,
    amortizaciones,
  };
}

// Ana Torres Ruiz tiene dos préstamos de ejemplo: uno liquidado y uno activo.
const prestamos: PrestamoMock[] = [
  crearPrestamo(
    '01',
    'cliente-1',
    {
      monto: 2000,
      tasaMensual: 15,
      diaPago: 'Lunes',
      pago: 575,
      plazo: 4,
      meses: 1,
      fechaEntrega: '2026-08-03',
      fechaInicio: '2026-08-10',
      fechaTermino: '2026-08-31',
    },
    4,
  ),
  crearPrestamo(
    '02',
    'cliente-1',
    {
      monto: 3000,
      tasaMensual: 15,
      diaPago: 'Lunes',
      pago: 487.5,
      plazo: 8,
      meses: 2,
      fechaEntrega: '2026-10-01',
      fechaInicio: '2026-10-12',
      fechaTermino: '2026-11-30',
    },
    3,
  ),
];

let siguienteFolio = 3;
let siguienteCliente = clientes.length + 1;
let siguienteRegistro = 1;

// ---- Respuestas ----

function ok(body: unknown, status = 200): Observable<HttpEvent<unknown>> {
  return timer(RETRASO_MS).pipe(map(() => new HttpResponse({ status, body: structuredClone(body) })));
}

function fallo(status: number, code?: string): Observable<never> {
  return timer(RETRASO_MS).pipe(
    mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: code ? { code } : null }))),
  );
}

function nombreCompleto(c: ClienteMock): string {
  return [c.nombre, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ');
}

/** Préstamo ACTIVO del cliente (a lo más uno), o null. */
function prestamoActivo(clienteId: string): { id: string; folio: string } | null {
  const activo = prestamos.find(p => p.clienteId === clienteId && p.estado === 'ACTIVO');
  return activo ? { id: activo.id, folio: activo.folio } : null;
}

// ---- Endpoints ----

function listarClientes(): Observable<HttpEvent<unknown>> {
  const lista = [...clientes]
    .sort((a, b) => b.registro - a.registro)
    .map(({ registro: _registro, ...cliente }) => ({
      ...cliente,
      prestamos: prestamos.filter(p => p.clienteId === cliente.id).length,
      prestamoActivo: prestamoActivo(cliente.id),
    }));
  return ok(lista);
}

function consultarCliente(id: string): Observable<HttpEvent<unknown>> {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) {
    return fallo(404, 'CLIENTE_NO_ENCONTRADO');
  }
  const { registro: _registro, ...datos } = cliente;
  return ok({ ...datos, prestamoActivo: prestamoActivo(id) });
}

function listarPrestamosDeCliente(clienteId: string): Observable<HttpEvent<unknown>> {
  const cliente = clientes.find(c => c.id === clienteId);
  if (!cliente) {
    return fallo(404, 'CLIENTE_NO_ENCONTRADO');
  }
  const lista = prestamos
    .filter(p => p.clienteId === clienteId)
    .sort((a, b) => b.folio.localeCompare(a.folio)) // el más reciente primero
    .map(p => ({
      id: p.id,
      folio: p.folio,
      monto: p.condiciones.monto,
      pago: p.condiciones.pago,
      plazo: p.condiciones.plazo,
      fechaEntrega: p.condiciones.fechaEntrega,
      fechaTermino: p.condiciones.fechaTermino,
      estado: p.estado,
    }));
  return ok({ cliente: { id: cliente.id, nombreCompleto: nombreCompleto(cliente) }, prestamos: lista });
}

function consultarPrestamo(id: string): Observable<HttpEvent<unknown>> {
  const prestamo = prestamos.find(p => p.id === id);
  const cliente = prestamo && clientes.find(c => c.id === prestamo.clienteId);
  if (!prestamo || !cliente) {
    return fallo(404, 'PRESTAMO_NO_ENCONTRADO');
  }
  const suma = (campo: 'capital' | 'interes' | 'gastos') =>
    redondear(prestamo.amortizaciones.reduce((total, a) => total + a[campo], 0));
  const totales = { capital: suma('capital'), interes: suma('interes'), gastos: suma('gastos'), total: 0 };
  totales.total = redondear(totales.capital + totales.interes + totales.gastos);

  const { registro: _registro, ...datosCliente } = cliente;
  return ok({
    id: prestamo.id,
    folio: prestamo.folio,
    estado: prestamo.estado,
    cliente: datosCliente,
    condiciones: prestamo.condiciones,
    totales,
    amortizaciones: prestamo.amortizaciones,
  });
}

function registrarPrestamo(body: unknown): Observable<HttpEvent<unknown>> {
  const datos = body as {
    clienteId?: string;
    cliente?: { nombre?: string; apellidoPaterno?: string; apellidoMaterno?: string; email?: string | null };
    condiciones?: CondicionesMock;
  } | null;
  const c = datos?.condiciones;

  if (!c || !(c.monto > 0) || !(c.plazo > 0) || !c.fechaInicio) {
    return fallo(400, 'CONDICIONES_INVALIDAS');
  }

  let cliente: ClienteMock | undefined;
  if (datos?.clienteId) {
    // Cliente existente: no puede tener un préstamo activo.
    cliente = clientes.find(cl => cl.id === datos.clienteId);
    if (!cliente) {
      return fallo(404, 'CLIENTE_NO_ENCONTRADO');
    }
    if (prestamoActivo(cliente.id)) {
      return fallo(409, 'PRESTAMO_ACTIVO_EXISTENTE');
    }
  } else {
    // Cliente nuevo.
    const nuevo = datos?.cliente;
    if (!nuevo?.nombre) {
      return fallo(400, 'CONDICIONES_INVALIDAS');
    }
    // El email es opcional: solo se revisa si está duplicado cuando viene uno.
    const email = nuevo.email?.trim().toLowerCase() || null;
    if (email && clientes.some(cl => cl.email?.toLowerCase() === email)) {
      return fallo(409, 'CLIENTE_EMAIL_DUPLICADO');
    }
    cliente = {
      id: `cliente-${siguienteCliente++}`,
      nombre: nuevo.nombre,
      apellidoPaterno: nuevo.apellidoPaterno ?? '',
      apellidoMaterno: nuevo.apellidoMaterno ?? '',
      email,
      registro: siguienteRegistro++,
    };
    clientes.push(cliente);
  }

  const folio = String(siguienteFolio++).padStart(2, '0');
  prestamos.push(crearPrestamo(folio, cliente.id, { ...c }));

  return ok({ id: folio, folio, clienteId: cliente.id }, 201);
}

// ---- Interceptor ----

const RUTA_CLIENTES = /\/api\/clientes\/?(\?.*)?$/;
const RUTA_CLIENTE = /\/api\/clientes\/([^/?]+)\/?(\?.*)?$/;
const RUTA_PRESTAMOS_DE_CLIENTE = /\/api\/clientes\/([^/?]+)\/prestamos\/?(\?.*)?$/;
const RUTA_PRESTAMOS = /\/api\/prestamos\/?(\?.*)?$/;
const RUTA_PRESTAMO = /\/api\/prestamos\/([^/?]+)\/?(\?.*)?$/;

export const clientesPrestamosMockInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  let coincidencia: RegExpExecArray | null;

  if (req.method === 'GET' && RUTA_CLIENTES.test(url)) {
    return listarClientes();
  }
  if (req.method === 'GET' && (coincidencia = RUTA_PRESTAMOS_DE_CLIENTE.exec(url))) {
    return listarPrestamosDeCliente(decodeURIComponent(coincidencia[1]));
  }
  if (req.method === 'GET' && (coincidencia = RUTA_CLIENTE.exec(url))) {
    return consultarCliente(decodeURIComponent(coincidencia[1]));
  }
  if (req.method === 'POST' && RUTA_PRESTAMOS.test(url)) {
    return registrarPrestamo(req.body);
  }
  if (req.method === 'GET' && (coincidencia = RUTA_PRESTAMO.exec(url))) {
    return consultarPrestamo(decodeURIComponent(coincidencia[1]));
  }
  return next(req);
};
