/**
 * Angular Application Configuration
 *
 * Global application setup and provider configuration.
 * Configures routing, animations, UI theme, HTTP client, and initialization services.
 */

// app.config.ts
import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import Preset from './preset';
import { MissingsBootstrapService } from './core/missings-bootstrap.service';

/**
 * Factory function for initializing missing items auto-sync on application startup
 *
 * Starts the MissingsBootstrapService which periodically fetches
 * missing/lost items from the API and updates the local state.
 *
 * Interval: 5 minutes (300,000 milliseconds)
 *
 * @returns {Function} Initialization function executed on app boot
 */
function startMissingsOnBoot() {
  return () => {
    const boot = inject(MissingsBootstrapService);
    boot.autoStart(5 * 60_000); // Start auto-sync every 5 minutes
  };
}

/**
 * Global Angular Application Configuration
 *
 * Providers configured:
 * 1. Router - Application routing configuration
 * 2. Animations - Enable async animations for better performance
 * 3. PrimeNG Theme - UI component styling with custom preset
 * 4. HTTP Client - Enable HTTP request support with legacy interceptor compatibility
 * 5. APP_INITIALIZER - Initialize missing items sync service on application startup
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Configure routing with application routes
    provideRouter(routes),
    // Enable animations for UI components
    provideAnimationsAsync(),
    // Configure PrimeNG UI component theme and styling
    providePrimeNG({
      theme: {
        preset: Preset, // Custom theme preset
        options: { darkModeSelector: '.dark', prefix: 'p' }, // Dark mode support
      },
    }),
    // Provide HttpClient for API requests with legacy interceptor support
    provideHttpClient(withInterceptorsFromDi()),
    // Initialize missing items auto-sync service at application startup
    { provide: APP_INITIALIZER, multi: true, useFactory: startMissingsOnBoot },
  ],
};
