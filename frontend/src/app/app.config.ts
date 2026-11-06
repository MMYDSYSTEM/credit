import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { clientesPrestamosMockInterceptor } from './mock/clientes-prestamos.mock';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    // Backend simulado solo si environment.mockApi es true; con false se usa el backend real.
    provideHttpClient(
      withFetch(),
      withInterceptors(environment.mockApi ? [clientesPrestamosMockInterceptor] : []),
    ),
    provideClientHydration(),
    providePrimeNG({
      license: environment.primengLicense || undefined,
      ripple: true,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng',
          },
        },
      },
    }),
  ],
};
