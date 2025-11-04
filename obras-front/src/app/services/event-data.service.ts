import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../core/api';
import { finalize, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventData {
  events = signal<any[]>([]);
  loading = signal(false);

  constructor(private api: ApiService) {}

  fetchEvents(): Observable<any[]> {
    this.loading.set(true);
    return this.api.request<any[]>('GET', 'events-history').pipe(
      tap((res) => {
        const normalized = (res ?? [])
          .map((ev) => this.normalizeEvent(ev))
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? b.created_at ?? 0).getTime() -
              new Date(a.createdAt ?? a.created_at ?? 0).getTime(),
          );
        this.events.set(normalized);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  eventById(id: number) {
    return computed(() => this.events().find((ev) => ev.id === id) ?? null);
  }

  private normalizeEvent(raw: any) {
    const parse = (data: any) => {
      if (!data) return null;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      return data;
    };

    return {
      ...raw,
      oldData: parse(raw?.oldData ?? raw?.old_data),
      newData: parse(raw?.newData ?? raw?.new_data),
    };
  }
}
