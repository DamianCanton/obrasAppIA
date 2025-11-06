import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { ConstructionComponent } from './pages/construction/construction';
import { ConstructionDetail } from './pages/construction-detail/construction-detail';
import { Deposit } from './pages/deposit/deposit';
import { Events } from './pages/events/events';
import { Notes } from './pages/notes/notes';
import { ConstructionWorkers } from './pages/construction-workers/construction-workers';
import { LoginComponent } from './pages/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { EventDetail } from './pages/event-detail/event-detail';
import { NoteEditor } from './pages/note-editor/note-editor';
import { MissingRegistry } from './pages/missing-registry/missing-registry';
import { AdminGuide } from './pages/admin-guide/admin-guide';

import { ArchitectLayout } from './layouts/architect-layout';
import { WorkerLayout } from './layouts/worker-layout';
import { WorkerElementsComponent } from './pages/worker-elements/worker-elements';
import { WorkerInventoryComponent } from './pages/worker-inventory/worker-inventory';
import { WorkerMissingsComponent } from './pages/worker-missings/worker-missings';
import { WorkerNotesComponent } from './pages/worker-notes/worker-notes';

export const routes: Routes = [
  // Login sin layout
  { path: 'login', component: LoginComponent },

  // Grupo ARQUITECTO (usa ArchitectLayout)
  {
    path: '',
    component: ArchitectLayout,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', component: Dashboard },
      { path: 'construction-workers', component: ConstructionWorkers },
      { path: 'constructions', component: ConstructionComponent },
      { path: 'construction/:id', component: ConstructionDetail },
      { path: 'deposit', component: Deposit },
      { path: 'events', component: Events },
      { path: 'missings', component: MissingRegistry },
      { path: 'event/:id', component: EventDetail },
      { path: 'notes', component: Notes },
      { path: 'note-editor/:id', component: NoteEditor },
      { path: 'note-editor/new', component: NoteEditor },
      {
        path: 'admin-guide',
        component: AdminGuide,
        data: { adminEmails: ['fede@ejemplo'] },
      },
    ],
  },

  // Grupo WORKER (usa WorkerLayout)
  {
    path: 'worker',
    component: WorkerLayout,
    canActivate: [AuthGuard],
    data: { roles: ['WORKER'] },
    children: [
      { path: 'elements', component: WorkerElementsComponent },
      { path: 'inventory', component: WorkerInventoryComponent },
      { path: 'missings', component: WorkerMissingsComponent },
      { path: 'notes', component: WorkerNotesComponent },
      { path: '', pathMatch: 'full', redirectTo: 'elements' },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '/login' },
];
