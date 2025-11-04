import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DialogModule } from 'primeng/dialog';
import { Element } from '../../models/interfaces.model';
import { AuthService } from '../../services/auth.service';
import { IftaLabel } from 'primeng/iftalabel';
import { Router } from '@angular/router';
import { ElementsService } from '../../services/elements.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-elements-table',
  standalone: true,
  imports: [
    TableModule,
    InputTextModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ConfirmPopupModule,
    ToastModule,
    DialogModule,
    IftaLabel,
    TooltipModule,
  ],
  templateUrl: './elements-table.component.html',
  styleUrl: './elements-table.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class ElementsTableComponent {
  /**
   * Tabla de elementos con CRUD, filtros por categoría/ubicación y
   * edición de notas asociadas. Consume `ElementsService` para datos
   * y usa PrimeNG para la UI.
   */
  private authService = inject(AuthService);
  private elementsSvc = inject(ElementsService);
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  public router = inject(Router);

  /** Usuario autenticado (arquitecto) para scoping de datos. */
  architect = this.authService.user();

  /** Lista reactiva de elementos proveniente del servicio. */
  elements = this.elementsSvc.elements;

  /** Opciones derivadas de categorías/ubicaciones para filtros. */
  categories = this.elementsSvc.categories;
  locations = this.elementsSvc.locations;

  /** Estado del filtro seleccionado (0: todas / 'all': todas). */
  selectedCategoryId = signal<number>(0);
  selectedLocationKey = signal<string>('all');

  /** Estado de filas expandidas en la tabla (PrimeNG). */
  expandedRowKeys: { [key: string]: boolean } = {};

  /** Estado del diálogo de alta/edición y del elemento seleccionado. */
  displayDialog = signal(false);
  isNew = signal(false);
  selectedElementId: number | null = null;

  /** Formulario reactivo para crear/editar elementos. */
  form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    brand: ['', Validators.required],
    provider: ['', Validators.required],
    buyDate: ['', Validators.required],
    categoryId: [null, Validators.required],
    locationKey: [null, Validators.required],
    locationId: [null, Validators.required],
    locationType: ['', Validators.required],
  });

  /**
   * Hook de inicialización del componente.
   * Carga inicial de elementos para el arquitecto autenticado.
   */
  ngOnInit() {
    if (!this.architect?.id) return;
    this.elementsSvc.init(this.architect.id).subscribe({
      error: () =>
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los elementos',
          life: 2500,
        }),
    });
  }

  // --- Fila expandida (sin noteId$Map) ---

  /**
   * Marca una fila como expandida en la tabla.
   * @param event Evento de PrimeNG con el elemento expandido.
   */
  onRowExpand(event: { data: Element }) {
    if (event?.data?.id != null) {
      this.expandedRowKeys = { ...this.expandedRowKeys, [event.data.id]: true };
    }
  }

  /**
   * Colapsa una fila previamente expandida en la tabla.
   * @param event Evento de PrimeNG con el elemento colapsado.
   */
  onRowCollapse(event: { data: Element }) {
    if (event?.data?.id != null) {
      const { [event.data.id]: _, ...rest } = this.expandedRowKeys;
      this.expandedRowKeys = rest;
    }
  }

  // --- Diálogos ---

  /**
   * Abre el diálogo para crear un nuevo elemento.
   * Inicializa el formulario y preselecciona la primera ubicación disponible (si existe).
   */
  openAddDialog() {
    this.form.reset();
    if (this.locations().length > 0) {
      const first = this.locations()[0];
      this.form.patchValue({ locationKey: first.key });
      this.applyLocationFromKey(first.key);
    } else {
      this.applyLocationFromKey(null);
    }
    this.displayDialog.set(true);
    this.isNew.set(true);
    this.selectedElementId = null;
  }

  /**
   * Abre el diálogo para editar un elemento existente.
   * @param element Elemento a editar; sus campos se precargan en el formulario.
   */
  openEditDialog(element: Element) {
    const key = this.buildLocationKey(
      element.currentLocationType ?? element.location?.locationType ?? null,
      element.currentLocationId ?? element.location?.locationId ?? null,
    );
    this.form.patchValue({
      name: element.name,
      brand: element.brand,
      provider: element.provider,
      buyDate: element.buyDate?.substring(0, 10),
      categoryId: element.category?.id ?? null,
      locationKey: key,
    });
    this.applyLocationFromKey(key);
    this.displayDialog.set(true);
    this.isNew.set(false);
    this.selectedElementId = element.id;
  }

  /**
   * Cancela y cierra el diálogo de alta/edición.
   * Limpia el formulario y deselecciona el elemento.
   */
  cancelDialog() {
    this.displayDialog.set(false);
    this.form.reset();
    this.selectedElementId = null;
  }

  // --- Guardar / Eliminar (CRUD) ---

  /**
   * Guarda el elemento en edición.
   * - Si `isNew` es true, crea un nuevo elemento.
   * - Si `isNew` es false, actualiza el elemento seleccionado.
   * Valida el formulario y normaliza `buyDate` a `YYYY-MM-DD` cuando llega como `Date`.
   */
  saveElement() {
    if (this.form.invalid || !this.architect?.id) return;

    let data = { ...this.form.value };
    if (data.buyDate instanceof Date) {
      data.buyDate = data.buyDate.toISOString().substring(0, 10);
    }

    data.currentLocationType = data.locationType ?? null;
    data.currentLocationId = data.locationId ?? null;
    delete data.locationKey;
    delete data.locationType;
    delete data.locationId;

    const afterSuccess = (summary: string) => {
      this.displayDialog.set(false);
      this.form.reset();
      this.messageService.add({ severity: 'success', summary, life: 2000 });
    };

    if (this.isNew()) {
      this.elementsSvc.create(this.architect.id, data).subscribe({
        next: () => afterSuccess('Elemento creado'),
        error: () =>
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el elemento',
            life: 2000,
          }),
      });
    } else if (this.selectedElementId != null) {
      this.elementsSvc
        .update(this.architect.id, this.selectedElementId, data)
        .subscribe({
          next: () => afterSuccess('Elemento actualizado'),
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el elemento',
              life: 2000,
            }),
        });
    }
  }

  /**
   * Abre un diálogo de confirmación y, si se acepta, elimina el elemento.
   * @param event Evento del click que disparó la confirmación (se usa como `target` del popup).
   * @param elementId ID del elemento a eliminar.
   */
  confirmDeleteElement(event: Event, elementId: number) {
    if (!this.architect?.id) return;
    this.confirmationService.confirm({
      // Nota: PrimeNG espera un HTMLElement; asegurate de castear correctamente si es necesario.
      target: event.currentTarget as EventTarget,
      message: '¿Seguro que deseas borrar este elemento?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Borrar', severity: 'danger' },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.elementsSvc.delete(this.architect!.id, elementId).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Elemento eliminado',
              life: 2000,
            });
          },
          error: () =>
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el elemento',
              life: 2000,
            }),
        });
      },
    });
  }

  /**
   * Devuelve la lista filtrada por la categoría y/o ubicacion seleccionada.
   * Si `selectedCategoryId` es 0 (o falsy), devuelve todos los elementos.
   * @returns Elementos filtrados por categoría y ubicaciones (o todos si no hay filtro).
   */
  filteredElements() {
    let list = this.elements();

    // Filtro por categoría
    const cat = this.selectedCategoryId();
    if (cat && cat !== 0) {
      list = list.filter((el) => el.category?.id === cat);
    }

    // Filtro por ubicación
    const locKey = this.selectedLocationKey();
    if (locKey && locKey !== 'all') {
      const parsed = this.parseLocationKey(locKey);
      if (parsed) {
        list = list.filter((el) => {
          const type =
            el.currentLocationType ?? el.location?.locationType ?? null;
          const id =
            el.currentLocationId ?? el.location?.locationId ?? null;
          return type === parsed.type && id === parsed.id;
        });
      }
    }

    return list;
  }

  /**
   * Aplica filtro global de PrimeNG sobre la tabla.
   * @param event Evento `input` del campo de búsqueda.
   * @param dt Referencia a la instancia de `p-table` (template variable).
   */
  onGlobalFilter(event: Event, dt: any) {
    const value = (event.target as HTMLInputElement).value;
    dt.filterGlobal(value, 'contains');
  }

  /**
   * Cambia el filtro de categoría seleccionada.
   * @param ev Evento `change` del `<select>` de categorías.
   */
  onCategoryChange(ev: Event) {
    const value = Number((ev.target as HTMLSelectElement).value);
    this.selectedCategoryId.set(value);
  }

  /**
   * Cambia el filtro de ubicación seleccionada.
   * @param ev Evento `change` del `<select>` de ubicaciones.
   * El valor esperado es `'all'` o la clave `'tipo:id'` (p.ej. `deposit:1`).
   */
  onLocationChange(ev: Event) {
    const value = (ev.target as HTMLSelectElement).value;
    this.selectedLocationKey.set(value || 'all');
  }

  onFormLocationSelect(ev: Event) {
    const key = (ev.target as HTMLSelectElement).value || null;
    this.form.patchValue({ locationKey: key });
    this.applyLocationFromKey(key);
  }

  /**
   * Obtiene el nombre descriptivo de una ubicación por `id` y `type`.
   * @param id ID de la ubicación (locationId).
   * @param type Tipo de ubicación (`deposit` | `construction`).
   * @returns Nombre legible o `'-'` si no se encuentra.
   */
  getLocationName(id?: number | null, type?: string | null): string {
    if (!type || id == null) return '-';
    const key = this.buildLocationKey(type, id);
    const found = key
      ? this.locations().find((l) => l.key === key)
      : undefined;
    if (found) return found.name;
    return type === 'deposit' ? `Depósito #${id}` : `Obra #${id}`;
  }

  /**
   * Navega al editor de notas para editar una nota existente.
   * @param noteId ID de la nota a editar.
   */
  editNote(noteId: number) {
    this.router.navigate(['note-editor', noteId], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  /**
   * Navega al editor de notas en modo creación, asociado a un elemento.
   * @param elementId ID del elemento para crear la nota.
   */
  createNoteForElement(elementId: number) {
    this.router.navigate(['note-editor', 'new'], {
      queryParams: { returnUrl: this.router.url, elementId },
    });
  }

  private parseLocationKey(key: string | null) {
    if (!key) return null;
    const [type, idStr] = key.split(':');
    const id = Number(idStr);
    if (!type || Number.isNaN(id)) return null;
    return { type: type as 'deposit' | 'construction', id };
  }

  private applyLocationFromKey(key: string | null) {
    const parsed = this.parseLocationKey(key);
    this.form.patchValue(
      {
        locationId: parsed?.id ?? null,
        locationType: parsed?.type ?? '',
      },
      { emitEvent: false },
    );
  }

  private buildLocationKey(
    type?: string | null,
    id?: number | null,
  ): string | null {
    if (!type || id == null) return null;
    return `${type}:${id}`;
  }
}
