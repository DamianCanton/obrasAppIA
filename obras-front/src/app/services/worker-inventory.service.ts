import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '../core/api';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface WorkerElementAssignmentView {
  id: number;
  worker: { id: number; name: string };
  assignedAt: string;
  returnedAt: string | null;
}

export interface WorkerElementView {
  id: number;
  name: string;
  brand: string;
  provider: string;
  buyDate: string;
  category: any;
  currentLocationType: string | null;
  currentLocationId: number | null;
  createdAt: string | Date;
  activeAssignment: WorkerElementAssignmentView | null;
  isAssigned: boolean;
  isAssignedToCurrentWorker: boolean;
}

export interface WorkerInventoryEntry {
  id: number;
  assignedAt: string;
  element: WorkerElementView;
}

@Injectable({ providedIn: 'root' })
export class WorkerInventoryService {
  private api = inject(ApiService);

  elements = signal<WorkerElementView[]>([]);
  inventory = signal<WorkerInventoryEntry[]>([]);
  loadingElements = signal(false);
  loadingInventory = signal(false);

  loadElements(workerId: number): Observable<WorkerElementView[]> {
    this.loadingElements.set(true);
    return this.api
      .request<WorkerElementView[]>(
        'GET',
        `workers/${workerId}/elements`,
      )
      .pipe(
        tap((items) => {
          this.elements.set(items ?? []);
          this.loadingElements.set(false);
        }),
      );
  }

  loadInventory(workerId: number): Observable<WorkerInventoryEntry[]> {
    this.loadingInventory.set(true);
    return this.api
      .request<WorkerInventoryEntry[]>(
        'GET',
        `workers/${workerId}/inventory`,
      )
      .pipe(
        tap((items) => {
          this.inventory.set(items ?? []);
          this.loadingInventory.set(false);
        }),
      );
  }

  assignElement(workerId: number, elementId: number) {
    return this.api
      .request<{
        assignment: WorkerInventoryEntry;
        element: WorkerElementView;
      }>('POST', `workers/${workerId}/inventory`, { elementId })
      .pipe(
        tap(({ assignment, element }) => {
          const entry: WorkerInventoryEntry = {
            id: assignment.id,
            assignedAt: assignment.assignedAt,
            element,
          };
          this.inventory.update((curr) => [
            entry,
            ...curr.filter((item) => item.element.id !== element.id),
          ]);
          this.mergeElement(element);
        }),
      );
  }

  returnElement(workerId: number, elementId: number) {
    return this.api
      .request<{
        assignment: WorkerInventoryEntry;
        element: WorkerElementView;
      }>('PATCH', `workers/${workerId}/inventory/${elementId}/return`, {})
      .pipe(
        tap(({ element }) => {
          this.inventory.update((curr) =>
            curr.filter((item) => item.element.id !== elementId),
          );
          this.mergeElement(element);
        }),
      );
  }

  private mergeElement(updated: WorkerElementView) {
    this.elements.update((curr) => {
      const exists = curr.some((el) => el.id === updated.id);
      if (!exists) return [updated, ...curr];
      return curr.map((el) => (el.id === updated.id ? updated : el));
    });
  }
}
