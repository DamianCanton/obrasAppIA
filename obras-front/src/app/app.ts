/**
 * Root Application Component
 *
 * The main component of the ObrasApp frontend application.
 * Acts as the container for the entire application routing and layout.
 *
 * Standalone component that imports only RouterOutlet for routing.
 * Layout-specific components (ArchitectLayout, WorkerLayout) are handled
 * at the route level in app.routes.ts based on user role.
 */

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
