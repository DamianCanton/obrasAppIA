/**
 * Login Component
 *
 * Authentication entry point for the application.
 * Provides a login form for both architects and construction workers.
 *
 * Responsibilities:
 * - Collect user credentials (email/name and password)
 * - Validate form input
 * - Authenticate against backend API
 * - Store authentication session
 * - Route to appropriate dashboard based on user role
 *
 * Features:
 * - Reactive form validation
 * - Error toast notifications
 * - Role-based redirects (architect to /, worker to /worker/elements)
 */

import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    CommonModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
})
export class LoginComponent {
  /** Reactive form for login credentials */
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private auth: AuthService,
    private msg: MessageService
  ) {
    // Initialize reactive form with validation
    this.form = this.fb.group({
      emailOrName: ['', Validators.required], // Email or username
      password: ['', Validators.required], // Password
    });
  }

  /**
   * Handle login form submission
   *
   * Process:
   * 1. Validate form input
   * 2. Send credentials to backend API
   * 3. Store authentication session on success
   * 4. Route to role-specific dashboard
   * 5. Show error toast on failure
   *
   * @returns {void}
   */
  submit() {
    // Validate form before submission
    if (this.form.invalid) return;

    // Send login request to backend
    this.api.request('POST', 'auth/login', this.form.value).subscribe({
      next: (res: any) => {
        // Store authenticated session
        this.auth.setAuth(res.user, res.role);

        // Route to role-specific dashboard
        if (res.role === 'architect') {
          this.router.navigate(['/']); // Architect dashboard
        } else if (res.role === 'worker') {
          this.router.navigate(['/worker/elements']); // Worker elements view
        } else {
          throw new Error('Unrecognized role');
        }
      },
      error: (err) => {
        // Display error notification
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Invalid credentials',
          life: 3000,
        });
      },
    });
  }
}
