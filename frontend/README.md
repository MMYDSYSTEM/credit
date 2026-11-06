# CreditWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Instrucciones
# Arquitectura del frontend Angular

> Instrucciones para cualquier asistente de IA o persona que cree, modifique o adapte código en este proyecto.
> Léelas completas antes de crear, mover o renombrar archivos.
> Las palabras **DEBE**, **NO DEBE** y **PUEDE** son obligatorias, prohibidas y opcionales, respectivamente.

---

## 1. Principios

1. **Organizar por funcionalidad de negocio**, no por tipo de archivo.
2. Dentro de cada funcionalidad, **separar datos (`data/`) de vista (`ui/`)**.
3. Dentro de la vista, **separar pantallas (`pages/`) de piezas (`components/`)**.
4. **El frontend valida y calcula para ayudar al usuario; el backend decide.**
   El frontend PUEDE validar formularios y hacer cálculos para mostrar o simular (sección 5.6).
   Lo que se guarda, cobra o autoriza lo calcula y valida el backend, aunque el frontend ya lo haya revisado.
   Regla corta: **lo que calcula el frontend se muestra; lo que calcula el backend se guarda.**
5. **Simplicidad primero.** No crear carpetas, capas ni abstracciones hasta que hagan falta (ver sección 7).
6. **Las convenciones existentes del proyecto tienen prioridad** sobre este documento en nombres,
   estilos y librerías. Si hay conflicto, sigue al proyecto y repórtalo.
7. **Revisa la versión de Angular en `package.json` antes de escribir código** y aplica la sección 1.1.

### 1.1 Versión de Angular

Este documento está escrito para **Angular 22** (TypeScript 6, Node 22 o superior).

| Tema | Angular 22 o superior | Angular 20–21 o proyecto que ya usa la forma anterior |
|---|---|---|
| Servicios | `@Service()` con dependencias por `inject()` | `@Injectable({ providedIn: 'root' })` |
| Detección de cambios | OnPush es el valor por defecto: NO escribir `changeDetection` | Escribir `changeDetection: ChangeDetectionStrategy.OnPush` |
| Componentes que necesitan el comportamiento anterior | `ChangeDetectionStrategy.Eager` (solo código heredado; no usar en código nuevo) | `ChangeDetectionStrategy.Default` |
| Lectura de datos | `httpResource()` o `rxResource()` (sección 5.3) | `Observable` del servicio con `subscribe`, o `toSignal()` |
| Formularios | **Signal Forms siempre** (`form()`, `[formField]`). Reactive Forms solo en las excepciones de la sección 5.5 | Reactive Forms (Signal Forms no es estable antes de la v22) |
| HTTP | `provideHttpClient()` sin `withFetch()` (fetch es el valor por defecto) | `provideHttpClient(withFetch())` |
| Pruebas | Vitest | Lo que use el proyecto (Karma/Jasmine o Vitest) |

Reglas de convivencia:

- Un proyecto existente NO DEBE migrarse a lo nuevo solo por estar disponible.
  Se migra cuando se toca ese código por otro motivo, o en una tarea dedicada y aprobada.
- Dentro de una misma funcionalidad, NO mezclar dos formas de hacer lo mismo.
  Excepción: los formularios, que siguen la regla de la sección 5.5 (Signal Forms por defecto).
- Las APIs marcadas como experimentales en la documentación oficial NO DEBEN usarse sin aprobación.

---

## 2. Estructura

```
src/app/
├── core/                          # Se usa una sola vez en toda la app
│   ├── auth/                      # login, guards, interceptor del token
│   ├── http/                      # interceptores de errores, URL base
│   └── layout/                    # menú, encabezado, pie
│
├── shared/                        # Reutilizable en toda la app, SIN lógica de negocio
│   ├── data/                      # modelos genéricos (Pagina<T>), utilidades,
│   │                              # validadores genéricos (teléfono, RFC, CURP)
│   └── ui/                        # componentes, pipes y directivas genéricos
│
├── features/                      # Una carpeta por funcionalidad de negocio
│   └── <funcionalidad>/
│       ├── <funcionalidad>.routes.ts
│       ├── data/                        # todo lo que NO es vista
│       │   ├── <funcionalidad>.service.ts
│       │   ├── <entidad>.model.ts
│       │   ├── <tema>.calculos.ts       # opcional: funciones puras (sección 5.6)
│       │   ├── <tema>.validadores.ts    # opcional: validadores de formulario propios (sección 5.6)
│       │   └── <nombre>.store.ts        # opcional (sección 5.3)
│       └── ui/
│           ├── pages/
│           │   └── <pantalla>/
│           │       ├── <pantalla>.ts
│           │       ├── <pantalla>.html
│           │       └── <pantalla>.css
│           └── components/              # opcional (sección 7)
│               └── <pieza>/
│                   ├── <pieza>.ts
│                   ├── <pieza>.html
│                   └── <pieza>.css
│
├── app.routes.ts
├── app.config.ts
└── app.ts
```

### Ejemplo real

```
features/usuarios/
├── usuarios.routes.ts
├── data/
│   ├── usuarios.service.ts
│   ├── usuario.model.ts
│   └── usuario.validadores.ts         # p. ej. contraseñas iguales
└── ui/
    ├── pages/
    │   ├── lista-usuarios/            # /usuarios
    │   └── formulario-usuario/        # /usuarios/nuevo y /usuarios/:id/editar
    └── components/
        ├── tabla-usuarios/
        └── selector-rol/

features/creditos/
├── creditos.routes.ts
├── data/
│   ├── creditos.service.ts
│   ├── credito.model.ts
│   └── pago.calculos.ts               # pago estimado según monto, interés y plazo
└── ui/
    ├── pages/
    │   └── nuevo-credito/             # muestra el pago estimado mientras se captura
    └── components/
        └── simulador-pago/
```

---

## 3. Qué va en cada carpeta

| Carpeta | DEBE contener | NO DEBE contener |
|---|---|---|
| `core/` | Servicios e interceptores que se cargan una vez; layout de la app | Pantallas o lógica de una funcionalidad |
| `shared/data/` | Tipos y utilidades genéricos usados por 3 o más funcionalidades | Modelos de una funcionalidad concreta |
| `shared/ui/` | Componentes, pipes y directivas genéricos (diálogo, cargando, formato de moneda) | Componentes que conocen el negocio (crédito, usuario…) |
| `features/x/data/` | Servicios HTTP, interfaces, store con signals, cálculos y validadores (funciones puras) | Componentes, HTML, CSS |
| `features/x/ui/pages/` | Un componente por ruta: inyecta servicios, carga datos, arma formularios, maneja acciones y navegación | Llamadas a `HttpClient` directas; fórmulas escritas dentro del componente |
| `features/x/ui/components/` | Piezas de presentación con `input()` y `output()`; PUEDEN usar cálculos y validadores de `data/` | Servicios o stores inyectados, llamadas HTTP, navegación |
| `features/x/x.routes.ts` | Rutas lazy de la funcionalidad y sus providers | Lógica |

---

## 4. Reglas de dependencias

### 4.1 Quién puede importar a quién

```
ui/pages       → ui/components, data, shared, core (solo servicios públicos)
ui/components  → data (solo modelos, cálculos y validadores), shared
data           → shared/data
shared         → (nada de features ni core)
core           → shared
```

### 4.2 Prohibiciones

1. `data/` NO DEBE importar nada de `ui/`.
2. `ui/components/` NO DEBE inyectar servicios ni stores de `data/`, ni usar `HttpClient` o `Router`.
   SÍ PUEDE importar modelos (tipos), cálculos y validadores.
3. Una funcionalidad NO DEBE importar archivos de otra funcionalidad.
   Si algo se necesita en dos funcionalidades:
   - si es genérico y lo usan 3 o más → moverlo a `shared/`;
   - si es de negocio → cada funcionalidad pide sus datos al backend, o se duplica el tipo pequeño.
4. `shared/` NO DEBE importar de `features/` ni de `core/`.
5. Ningún archivo DEBE usar rutas relativas que suban más de 3 niveles (`../../../../`).
   Si pasa, probablemente está en el lugar equivocado.

---

## 5. Reglas por tipo de archivo

### 5.1 Páginas (`ui/pages/`)

- Una página por ruta. Si dos rutas usan la misma pantalla (crear y editar), comparten la página.
- Los parámetros de ruta llegan con `input()` (requiere `withComponentInputBinding()`).
- Manejan los estados de cargando, error y vacío.
- Después de una acción que cambia datos (crear, editar, eliminar, pagar), vuelven a pedir los datos al backend.
  NO DEBEN modificar la lista o el saldo a mano.

### 5.2 Piezas (`ui/components/`)

- Reciben datos con `input()` / `input.required()` y avisan con `output()`.
- Usan detección de cambios OnPush: en Angular 22 es el valor por defecto y no se escribe;
  en versiones anteriores se escribe `changeDetection: ChangeDetectionStrategy.OnPush`.
- PUEDEN tener estado visual propio (abierto/cerrado, pestaña activa) con `signal()`.
- PUEDEN calcular valores para mostrar con `computed()` llamando a funciones de `<tema>.calculos.ts`
  (por ejemplo, un simulador que muestra el pago estimado al cambiar monto o plazo).

### 5.3 Datos (`data/`)

- **Servicio:** `@Service()` en Angular 22 (`@Injectable({ providedIn: 'root' })` en versiones anteriores),
  con dependencias por `inject()`. Un método por endpoint. Un servicio por funcionalidad;
  si pasa de ~200 líneas, dividirlo por tema.
  - **Lecturas (GET):** el método PUEDE devolver un `httpResource()` que recibe los parámetros como signals,
    para que la pantalla tenga `value()`, `isLoading()` y `error()` y se recargue sola al cambiar el parámetro.
    Ese método se llama desde un inicializador de campo de la página (contexto de inyección).
  - **Escrituras (POST, PUT, DELETE):** el método devuelve el `Observable` de `HttpClient`.
    `httpResource()` NO DEBE usarse para escrituras.
  - Las llamadas HTTP siguen viviendo solo en `data/`, también cuando se usa `httpResource()`.

  ```ts
  @Service()
  export class UsuariosService {
    private readonly http = inject(HttpClient);
    private readonly url = '/api/usuarios';

    usuario(id: Signal<number | undefined>) {                       // lectura
      return httpResource<Usuario>(() => (id() ? `${this.url}/${id()}` : undefined));
    }

    actualizar(id: number, datos: UsuarioGuardar) {                 // escritura
      return this.http.put<Usuario>(`${this.url}/${id}`, datos);
    }
  }
  ```
- **Modelo:** solo `interface` y `type`. Sin clases con lógica.
- **Store** (`<nombre>.store.ts`): SOLO cuando dos o más pantallas o piezas comparten el mismo estado.
  Usa `signal()` y `computed()`. Si el estado es de una sola pantalla, vive en la página.
- **Cálculos** (`<tema>.calculos.ts`): funciones puras, sin Angular.
- **Validadores** (`<tema>.validadores.ts`): funciones de validación de Signal Forms.
  Solo en las excepciones de la sección 5.5 se escriben como `ValidatorFn` de Reactive Forms. Ver sección 5.6.

### 5.4 Rutas

- Cada funcionalidad expone sus rutas en `<funcionalidad>.routes.ts`.
- `app.routes.ts` las carga con `loadChildren`. Las páginas se cargan con `loadComponent`.
- Los parámetros de ruta llegan a la página como `input()` mediante `withComponentInputBinding()` en `provideRouter`.
- En Angular 22 las rutas hijas heredan los parámetros de sus rutas padre por defecto
  (`paramsInheritanceStrategy: 'always'`). Al leer un parámetro, usar el nombre exacto de la ruta
  y no reutilizar el mismo nombre (`:id`) en una ruta padre y una hija.

### 5.5 Formularios

**Regla: todo formulario nuevo DEBE usar Signal Forms** (`@angular/forms/signals`): `form()`, los validadores
`required()`, `email()`, `min()`, `max()`, `minLength()`, `maxLength()`, `pattern()`, `minDate()`, `maxDate()`,
y `[formField]` en la plantilla. Esto aplica también a formularios nuevos dentro de funcionalidades
que ya tienen formularios con Reactive Forms.

**Reactive Forms solo se permite en estos casos excepcionales:**

| Excepción | Ejemplo |
|---|---|
| El proyecto usa Angular 21 o anterior | Signal Forms no es estable en esa versión |
| Modificar un formulario existente hecho con Reactive Forms, sin tarea aprobada de migración | Agregar un campo a un formulario que ya existe |
| Una librería obligatoria solo funciona con `FormGroup`/`FormControl` y no tiene versión para Signal Forms | Un generador de formularios dinámicos basado en Reactive Forms |
| Una necesidad que Signal Forms no cubre, comprobada en la documentación oficial de la versión del proyecto | Se documenta cuál es en el comentario (abajo) |

Al usar una excepción:

1. Agregar un comentario en el componente con el motivo:
   `// Reactive Forms: <excepción de la sección 5.5 y motivo concreto>`.
2. Reportarlo en el resumen de la tarea.
3. Si la excepción es la cuarta (necesidad no cubierta), pedir aprobación antes de escribir el código.
4. Un formulario NO DEBE mezclar Signal Forms y Reactive Forms.
5. Al reescribir por completo un formulario de Reactive Forms, se reescribe con Signal Forms.

**Validadores:**

- Usar primero los validadores que trae Signal Forms.
- Crear validadores propios solo cuando no alcancen, como funciones de validación de Signal Forms
  (`validate()`) en `<tema>.validadores.ts` (sección 5.6).
- Validaciones que necesitan al backend (por ejemplo, correo disponible) con `validateHttp()` o `validateAsync()`,
  usando su opción `debounce` para no enviar una petición por cada tecla.

  ```ts
  // Signal Forms (Angular 22)
  protected readonly modelo = signal<UsuarioGuardar>({ nombre: '', correo: '', rol: 'CONSULTA', activo: true });
  protected readonly formulario = form(this.modelo, (f) => {
    required(f.nombre, { message: 'El nombre es obligatorio.' });
    required(f.correo, { message: 'El correo es obligatorio.' });
    email(f.correo, { message: 'Escribe un correo válido.' });
  });
  ```
- Mostrar el mensaje de error junto al campo cuando el campo fue tocado o al intentar guardar.
- Deshabilitar el botón de guardar mientras se envía, no mientras el formulario es inválido:
  al pulsarlo con errores, marcar todos los campos como tocados para que el usuario vea qué falta.
- Los errores que devuelva el backend (por ejemplo `CORREO_DUPLICADO`) se traducen a un mensaje
  y, si corresponde a un campo, se muestran junto a ese campo.

### 5.6 Validaciones y cálculos en el frontend

El frontend PUEDE validar y calcular para que el usuario vea errores y resultados al momento.

**Permitido en el frontend:**

| Tipo | Ejemplos |
|---|---|
| Validación de forma | Nombre requerido, formato de correo, longitud, solo números, rango de fechas, contraseñas iguales |
| Validación de coherencia en el formulario | Fecha final posterior a la inicial, monto dentro del mínimo y máximo que informa el backend |
| Cálculo para mostrar o simular | Pago estimado según monto, interés y plazo; total de una lista; porcentaje de avance; días de atraso para mostrar |
| Comprobación previa para ayudar | Avisar que el pago es mayor que el saldo mostrado, antes de enviarlo |

**Siempre en el backend, aunque el frontend también lo revise:**

| Tipo | Ejemplos |
|---|---|
| Lo que se guarda o cobra | Monto final del pago, tabla de amortización definitiva, saldo, intereses aplicados |
| Lo que depende de datos que el frontend no tiene completos | Correo duplicado, elegibilidad, historial de pagos, límites por cliente |
| Lo que autoriza | Permisos, roles, aprobaciones |

**Reglas:**

1. Los cálculos y validadores propios DEBEN escribirse como **funciones puras** en `data/`
   (`<tema>.calculos.ts`, `<tema>.validadores.ts`), no dentro del componente.
   Así se prueban con pruebas unitarias y se reutilizan en varias pantallas.
2. Los validadores genéricos, que no conocen el negocio (teléfono, RFC, CURP, código postal),
   van en `shared/data/`.
3. Los parámetros del negocio (tasa de interés, plazos permitidos, montos mínimo y máximo)
   DEBEN venir del backend, por ejemplo de un endpoint de catálogo o configuración.
   NO DEBEN escribirse fijos en el frontend.
4. Al guardar, el frontend DEBE enviar los **datos capturados** (monto, plazo, fecha),
   no los resultados que calculó (pago, total). El backend calcula de nuevo y su resultado es el válido.
5. Si un cálculo del frontend puede diferir del backend (por redondeo, fechas o reglas),
   la pantalla DEBE indicarlo como estimado ("Pago estimado") hasta recibir la respuesta del backend.
6. Si una fórmula existe en ambos lados, sus pruebas unitarias DEBEN usar los mismos ejemplos
   que las pruebas del backend. Si los resultados no coinciden, el backend tiene la razón y el frontend se corrige.

**Ejemplo de ubicación:**

```
features/creditos/data/pago.calculos.ts
  export function pagoEstimado(monto: number, tasaMensual: number, numeroPagos: number, pagosPorMes: number): number

features/creditos/data/pago.calculos.spec.ts      # pruebas con los mismos casos que el backend

features/creditos/ui/components/simulador-pago/   # muestra "Pago estimado: $500.00" usando pagoEstimado()
features/creditos/ui/pages/nuevo-credito/         # envía monto, tasa y plazo; muestra el resultado del backend
```

---

## 6. Convenciones de nombres

| Elemento | Formato | Ejemplo |
|---|---|---|
| Carpeta de funcionalidad | plural, kebab-case | `usuarios/`, `creditos/` |
| Página | acción o vista + entidad | `lista-usuarios/`, `detalle-credito/`, `formulario-usuario/` |
| Pieza | qué es + entidad | `tabla-usuarios/`, `selector-rol/`, `tarjeta-renovacion/` |
| Servicio | `<funcionalidad>.service.ts` | `usuarios.service.ts` |
| Modelo | `<entidad>.model.ts` (singular) | `usuario.model.ts` |
| Store | `<contexto>.store.ts` | `credito-detalle.store.ts` |
| Cálculos | `<tema>.calculos.ts` | `pago.calculos.ts` |
| Validadores | `<tema>.validadores.ts` | `usuario.validadores.ts` |
| Rutas | `<funcionalidad>.routes.ts` | `usuarios.routes.ts` |
| Clase de componente | PascalCase, sin sufijo, salvo que el proyecto use `Component` | `ListaUsuarios` |
| Selector | `app-` + nombre de carpeta | `app-tabla-usuarios` |

- Visibilidad: `protected readonly` para lo que usa la plantilla, `private readonly` para lo inyectado,
  `readonly` público solo para `input()`, `output()` y `model()`.
- Usar una sola convención en todo el proyecto. Si el proyecto ya usa sufijos (`.component.ts`), mantenerlos.

---

## 7. Cuándo crear cada carpeta

| Situación | Acción |
|---|---|
| Funcionalidad nueva | Crear `<funcionalidad>.routes.ts`, `data/` y `ui/pages/`. NO crear `ui/components/` vacía |
| Una página pasa de ~150 líneas de plantilla o hace varias cosas | Extraer piezas a `ui/components/` |
| Una pieza se usa en 2 páginas de la misma funcionalidad | Debe estar en `ui/components/` |
| Algo genérico se usa en 3 o más funcionalidades | Moverlo a `shared/` |
| Dos o más pantallas comparten estado | Crear un store en `data/` |
| Más de 10–12 funcionalidades | Agruparlas por área: `features/<area>/<funcionalidad>/`, cada una con esta misma forma |

NO DEBES crear carpetas vacías, servicios "por si acaso", ni capas que solo pasen llamadas de un lado a otro.

---

## 8. Procedimientos

### 8.1 Crear una funcionalidad nueva

1. Confirmar el nombre de la funcionalidad (plural, en el lenguaje del negocio y del backend).
2. Crear `features/<funcionalidad>/data/<entidad>.model.ts` con las interfaces que devuelve el backend.
3. Crear `features/<funcionalidad>/data/<funcionalidad>.service.ts` con un método por endpoint.
4. Crear cada pantalla en `features/<funcionalidad>/ui/pages/<pantalla>/`.
5. Crear `features/<funcionalidad>/<funcionalidad>.routes.ts` con `loadComponent` para cada página.
6. Registrar la funcionalidad en `app.routes.ts` con `loadChildren`.
7. Extraer piezas a `ui/components/` solo si se cumple alguna condición de la sección 7.
8. Verificar las reglas de la sección 4 y ejecutar build, pruebas y lint.

### 8.2 Agregar una pantalla a una funcionalidad existente

1. Crear `ui/pages/<pantalla>/`.
2. Agregar su ruta en `<funcionalidad>.routes.ts`.
3. Si necesita un endpoint nuevo, agregar el método al servicio y los tipos al modelo.
4. Reutilizar piezas de `ui/components/` antes de crear nuevas.

### 8.3 Agregar una pieza

1. Confirmar que se cumple alguna condición de la sección 7.
2. Crearla en `ui/components/<pieza>/` con solo `input()` y `output()`.
3. Si la necesitan 3 o más funcionalidades y no conoce el negocio, crearla en `shared/ui/`.

### 8.4 Adaptar un proyecto existente a esta estructura

Hacerlo de forma gradual, una funcionalidad a la vez, sin detener el desarrollo:

1. **Inventario:** listar las carpetas actuales y asignar cada archivo a una funcionalidad,
   a `core/` o a `shared/`. Presentar la tabla antes de mover nada.
2. **Elegir una funcionalidad pequeña** como piloto.
3. **Mover sus archivos** a `features/<funcionalidad>/` según la sección 3:
   - servicios y modelos → `data/`;
   - componentes con ruta → `ui/pages/`;
   - componentes sin ruta → `ui/components/`.
4. **Actualizar imports y rutas.** Cambiar la carga de esa funcionalidad a `loadChildren`.
5. **No cambiar comportamiento** al mover: solo ubicación e imports. Las mejoras van en cambios aparte.
6. **Ejecutar build y pruebas** después de cada funcionalidad movida.
7. Repetir con la siguiente funcionalidad. Al final, lo que quede en carpetas globales
   (`components/`, `services/`) va a `shared/` si es genérico o a `core/` si es único.

### 8.5 Modificar la estructura (agregar o cambiar una regla)

1. Proponer el cambio y su motivo antes de aplicarlo.
2. Actualizar este documento en el mismo cambio que modifica el código.
3. Aplicar el cambio a todas las funcionalidades afectadas, o dejar anotado cuáles faltan.

---

## 9. Lista de verificación antes de terminar una tarea

- [ ] Cada archivo nuevo está en la carpeta que indica la sección 3.
- [ ] `data/` no importa de `ui/`.
- [ ] Ninguna pieza de `ui/components/` inyecta servicios o stores ni usa `HttpClient` o `Router`.
- [ ] Ninguna funcionalidad importa archivos de otra.
- [ ] No hay carpetas vacías ni abstracciones sin uso.
- [ ] Las validaciones y cálculos propios están en funciones puras en `data/` y tienen pruebas.
- [ ] Los parámetros del negocio (tasas, plazos, límites) vienen del backend, no están fijos en el código.
- [ ] Al guardar se envían los datos capturados, no los resultados calculados en el frontend.
- [ ] Los cálculos que pueden diferir del backend se muestran como estimados.
- [ ] Los nombres siguen la sección 6 o la convención existente del proyecto.
- [ ] Las rutas nuevas son lazy y están registradas.
- [ ] El código sigue la columna de la sección 1.1 que corresponde a la versión de Angular del proyecto,
      y no mezcla dos formas de hacer lo mismo dentro de una funcionalidad.
- [ ] No se usaron APIs experimentales sin aprobación.
- [ ] Los formularios nuevos usan Signal Forms. Cada uso de Reactive Forms corresponde a una excepción
      de la sección 5.5, tiene su comentario con el motivo y se reportó.
- [ ] Build, pruebas y lint pasan.
- [ ] Se reportaron los conflictos entre este documento y el proyecto, si los hubo.

---

## 10. Cuando haya dudas

1. Revisa cómo está resuelto en una funcionalidad existente y sigue el mismo patrón.
2. Si no hay ejemplo, elige la opción más simple que cumpla las reglas de la sección 4.
3. Si la decisión afecta a varias funcionalidades o cambia una regla, pregunta antes de aplicarla.