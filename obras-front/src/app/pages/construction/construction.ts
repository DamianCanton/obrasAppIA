/**
 * Construction Management Component
 *
 * Main page for architects to manage construction projects.
 * Displays list of constructions and provides CRUD operations.
 *
 * Key Features:
 * - Display all constructions for authenticated architect
 * - Create new construction projects
 * - Delete existing constructions with confirmation
 * - Navigate to construction detail page
 * - Real-time list updates after operations
 * - Toast notifications for user feedback
 *
 * Data Flow:
 * 1. Component initializes and fetches architect's constructions
 * 2. User can create new construction via modal dialog
 * 3. List updates immediately after successful creation/deletion
 * 4. Navigation to detail page for viewing/editing specific projects
 */

import { Component, inject, Inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Construction } from '../../models/interfaces.model';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '../../services/auth.service';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-constructions',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    ToastModule,
    ConfirmPopupModule,
    CommonModule,
    InputText,
    ReactiveFormsModule,
    DialogModule,
  ],
  templateUrl: './construction.html',
  styleUrl: './construction.scss',
  providers: [ConfirmationService, MessageService],
})
export class ConstructionComponent {
  private authService = inject(AuthService);
  /** List of construction projects for current architect */
  works = signal<Construction[]>([]);
  /** Form for creating new construction */
  formGroup: FormGroup;
  /** Current authenticated architect */
  architect = this.authService.user();
  /** Controls visibility of add construction dialog */
  displayAddDialog = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    // Initialize form with required fields
    this.formGroup = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  /**
   * Angular lifecycle hook - runs after component initialization
   * Fetches constructions from API
   */
  ngOnInit() {
    this.fetchWorks();
  }

  /**
   * Fetch all constructions for the authenticated architect
   * Updates the works signal with API response
   */
  fetchWorks() {
    this.api
      .request('GET', `architect/${this.architect?.id}/construction`)
      .subscribe((res) => this.works.set(res as Construction[]));
  }

  /**
   * Create a new construction project
   *
   * Process:
   * 1. Validate form input
   * 2. Send POST request with form data
   * 3. Reset form on success
   * 4. Refresh constructions list
   * 5. Show success/error toast message
   */
  createWork() {
    if (this.formGroup.invalid) return;
    this.api
      .request(
        'POST',
        `architect/${this.architect?.id}/construction`,
        this.formGroup.value
      )
      .subscribe({
        next: () => {
          this.formGroup.reset();
          this.fetchWorks();
          this.messageService.add({
            severity: 'success',
            summary: 'Construction Created',
            detail: 'The construction project was created successfully',
            life: 2500,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not create the construction project',
            life: 2500,
          });
        },
      });
  }

  /**
   * Show confirmation dialog before deleting construction
   * @param {Event} event - Click event for positioning confirmation popup
   * @param {number} id - ID of construction to delete
   */
  confirmDeleteWork(event: Event, id: number) {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: '¿Seguro que deseas borrar esta obra?',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: 'Borrar', severity: 'danger' },
      rejectButtonProps: {
        label: 'Cancelar',
        severity: 'secondary',
        outlined: true,
      },
      accept: () => {
        this.api
          .request(
            'DELETE',
            `architect/${this.architect?.id}/construction/${id}`
          )
          .subscribe({
            next: () => {
              this.fetchWorks();
              this.messageService.add({
                severity: 'success',
                summary: 'Obra eliminada',
                detail: 'La obra fue eliminada correctamente',
                life: 2500,
              });
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo borrar la obra',
                life: 2500,
              });
            },
          });
      },
    });
  }

  goToWork(id: string | number) {
    this.router.navigate(['/construction', id]);
  }
}
