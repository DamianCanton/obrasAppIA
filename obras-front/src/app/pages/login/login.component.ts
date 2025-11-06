import { Component, signal } from '@angular/core';
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
import { AuthService, User, UserRole } from '../../services/auth.service';

interface AuthResponse {
  accessToken: string;
  user: User & { architectId?: number | null };
}

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
  form: FormGroup;
  submitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private auth: AuthService,
    private msg: MessageService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.api.request<AuthResponse>('POST', 'auth/login', this.form.value).subscribe({
      next: (res) => {
        const { user, accessToken } = res;
        const normalizedUser: User = {
          id: user.id,
          name: user.name ?? user.email,
          email: user.email,
          role: user.role as UserRole,
          architectId: user.architectId ?? null,
        };

        this.auth.setSession(normalizedUser, accessToken);

        if (normalizedUser.role === 'ADMIN') {
          this.router.navigate(['/']);
        } else if (normalizedUser.role === 'WORKER') {
          this.router.navigate(['/worker/elements']);
        } else {
          throw new Error('Rol no reconocido');
        }
      },
      error: (err) => {
        const detail =
          err?.status === 401
            ? 'Credenciales invalidas'
            : err?.error?.message ?? 'No se pudo iniciar sesion';

        this.msg.add({
          severity: 'error',
          summary: 'Inicio de sesion',
          detail,
          life: 4000,
        });
      },
      complete: () => this.submitting.set(false),
    });
  }
}
