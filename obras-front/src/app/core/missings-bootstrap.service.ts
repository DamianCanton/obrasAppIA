// core/missings-bootstrap.service.ts
import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { MissingsService } from '../services/missings.service';
import { timer, Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class MissingsBootstrapService {
  private missings = inject(MissingsService);
  private auth = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private startedForId: number | null = null;

  /** Arranque reactivo al login de arquitecto */
  autoStart(pollMs: number) {
    effect((onCleanup) => {
      const role = this.auth.role();
      const user = this.auth.user();

      // Si desloguea o no es admin/arquitecto, cortar polling anterior
      if (role !== 'ADMIN' || !user) {
        this.startedForId = null;
        return;
      }

      // Tomar architectId real si existe; fallback a user.id
      const architectId = (user as any).architectId ?? user.id;
      if (!architectId) return;

      // Evitar re-iniciar si ya está corriendo para este id
      if (this.startedForId === architectId) return;
      this.startedForId = architectId;

      // Fetch inicial
      const initSub = this.missings.initForArchitect(architectId).subscribe();

      // Polling
      const pollSub: Subscription = timer(pollMs, pollMs)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.missings.refresh().subscribe());

      // Cleanup cuando cambia user/role o se destruye el servicio
      onCleanup(() => {
        initSub?.unsubscribe();
        pollSub?.unsubscribe();
        this.startedForId = null;
      });
    }, { allowSignalWrites: true });
  }
}
