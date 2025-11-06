// app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';
import Preset from './preset';
import { MissingsBootstrapService } from './core/missings-bootstrap.service';
import { authInterceptor } from './core/auth.interceptor';

function startMissingsOnBoot() {
  return () => {
    const boot = inject(MissingsBootstrapService);
    boot.autoStart(5 * 60_000); // 5 minutos
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Preset,
        options: { darkModeSelector: '.dark', prefix: 'p' },
      },
    }),
    provideHttpClient(
      withInterceptors([authInterceptor]),
      withInterceptorsFromDi(),
    ),
    { provide: APP_INITIALIZER, multi: true, useFactory: startMissingsOnBoot },
  ],
};
