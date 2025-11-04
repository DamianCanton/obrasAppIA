/**
 * Angular Application Bootstrap
 *
 * Entry point for the ObrasApp frontend application.
 * Initializes the Angular platform and mounts the root App component.
 * Applies global application configuration from app.config.ts
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import 'zone.js';

// Bootstrap the application with the root App component and global configuration
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
