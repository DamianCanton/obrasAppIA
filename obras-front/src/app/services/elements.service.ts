/**
 * Elements Service
 *
 * Manages inventory/elements state and operations.
 * Handles elements fetching, caching, and provides computed categories and locations.
 *
 * Key Features:
 * - Reactive state management using Angular signals
 * - Derived computed signals for categories and locations
 * - Request caching to prevent duplicate API calls
 * - Loading/loaded state tracking
 * - Elements filtering and search
 *
 * Data Structure:
 * - Elements: List of all inventory items
 * - Categories: Unique categories derived from elements
 * - Locations: Unique storage locations (deposits or constructions)
 */

import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { Element } from '../models/interfaces.model';

/** Type for category option in dropdown/filter */
export type CategoryOpt = { id: number; name: string };

/** Type for location option (deposit or construction site) */
export type LocationOpt = {
  key: string;
  id: number;
  type: 'deposit' | 'construction';
  name: string;
};

@Injectable({ providedIn: 'root' })
export class ElementsService {
  /** Signal containing all elements/inventory items */
  elements = signal<Element[]>([]);

  /**
   * Computed signal for unique categories
   * Automatically derives categories from elements list
   * Updates whenever elements signal changes
   */
  categories = computed<CategoryOpt[]>(() => {
    const map = new Map<number, CategoryOpt>();
    for (const el of this.elements()) {
      const c = (el as any)?.category;
      if (c?.id && !map.has(c.id)) map.set(c.id, { id: c.id, name: c.name });
    }
    return Array.from(map.values());
  });

  /**
   * Computed signal for unique storage locations
   * Groups locations by type (deposit or construction) and ID
   * Used for filtering elements by location
   */
  locations = computed<LocationOpt[]>(() => {
    const map = new Map<string, LocationOpt>();
    for (const el of this.elements()) {
      const loc = (el as any)?.location;
      if (!loc?.locationType || !loc?.locationId) continue;
      const key = `${loc.locationType}:${loc.locationId}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          id: loc.locationId,
          type: loc.locationType,
          // TODO: Join with actual names from API for better labels
          name:
            loc.locationType === 'deposit'
              ? `Deposit #${loc.locationId}`
              : `Construction #${loc.locationId}`,
        });
      }
    }
    return Array.from(map.values());
  });

  /** Tracks if data has been loaded at least once */
  private _loaded = signal(false);
  /** Tracks if loading operation is currently in progress */
  private _loading = signal(false);
  /** In-flight request cache to prevent duplicate API calls */
  private inflight$?: Observable<Element[]>;

  constructor(private api: ApiService) {}

  /**
   * Fetch all elements for an architect
   * Implements request caching to avoid duplicate concurrent calls
   * Updates elements signal with response
   *
   * @param {number} architectId - ID of the architect
   * @returns {Observable<Element[]>} Observable of elements array
   */
  fetchByArchitect(architectId: number): Observable<Element[]> {
    this._loading.set(true);
    return this.api
      .request<Element[]>('GET', `architect/${architectId}/element`)
      .pipe(
        tap({
          next: (res) => {
            this.elements.set(res);
            this._loaded.set(true);
          },
        }),
        finalize(() => this._loading.set(false))
      );
  }

  /**
   * Initializes elements data with caching
   * Returns cached data if available
   * Prevents duplicate concurrent requests
   *
   * @param {number} architectId - ID of the architect
   * @returns {Observable<Element[]>} Observable of elements array
   */
  init(architectId: number): Observable<Element[]> {
    if (this._loaded()) return of(this.elements());
    if (this._loading() && this.inflight$) return this.inflight$;

    this.inflight$ = this.fetchByArchitect(architectId).pipe(
      shareReplay(1),
      finalize(() => (this.inflight$ = undefined))
    );
    console.log(this.categories());
    return this.inflight$;
  }

  /**
   * Ensures elements data is loaded
   * Uses init() internally for caching logic
   *
   * @param {number} architectId - ID of the architect
   * @returns {Observable<Element[]>} Observable of elements array
   */
  ensureLoaded(architectId: number): Observable<Element[]> {
    return this.init(architectId);
  }

  /**
   * Force refresh elements from backend
   * Used after CRUD operations to get latest data
   *
   * @param {number} architectId - ID of the architect
   * @returns {Observable<Element[]>} Observable of fresh elements array
   */
  refresh(architectId: number): Observable<Element[]> {
    return this.fetchByArchitect(architectId).pipe(shareReplay(1));
  }

  /**
   * Get loading state
   * @returns {boolean} true if currently loading
   */
  get loaded() {
    return this._loaded();
  }

  /**
   * Get loaded state
   * @returns {boolean} true if data has been loaded
   */
  get loading() {
    return this._loading();
  }

  /** CRUD con actualización local simple */
  create(architectId: number, dto: any): Observable<void> {
    return this.api
      .request<void>('POST', `architect/${architectId}/element`, dto)
      .pipe(
        tap(() => {
          // tras crear, refrescamos para mantener consistencia
          this.fetchByArchitect(architectId).subscribe();
        })
      );
  }

  update(architectId: number, elementId: number, dto: any): Observable<void> {
    return this.api
      .request<void>(
        'PUT',
        `architect/${architectId}/element/${elementId}`,
        dto
      )
      .pipe(
        tap(() => {
          this.fetchByArchitect(architectId).subscribe();
        })
      );
  }

  delete(architectId: number, elementId: number): Observable<void> {
    return this.api
      .request<void>('DELETE', `architect/${architectId}/element/${elementId}`)
      .pipe(
        tap(() => {
          this.elements.set(this.elements().filter((e) => e.id !== elementId));
        })
      );
  }
}
