// interfaces.model.ts

export interface Architect {
  id: number;
  name: string;
  email: string;
  password: string;
  payment_level: PlanLimit;
  construction_workers: ConstructionWorker[];
  constructions: Construction[];
  elements: Element[];
  deposits: Deposit[];
  notes: Note[];
  missings: Missing[];
  created_at?: string;
}

export interface PlanLimit {
  id: number;
  name: string;
  max_elements: number;
  max_deposits: number;
  max_constructions: number;
  max_workers: number;
  architects?: Architect[];
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  elements?: Element[];
  created_at?: string;
}

export interface Construction {
  id: number;
  title: string;
  description: string;
  createdAt?: string;
}

export interface ConstructionWorker {
  id: number;
  name: string;
  email: string;
  architect: Architect;
  elements: Element[];
  assignments?: WorkerElementAssignment[];
  notes?: Note[];
  created_at?: string;
}

export interface Deposit {
  id: number;
  name: string;
  address: string;
  architect: Architect;
  elements: Element[];
  created_at?: string;
}

export interface Element {
  id: number;
  name: string;
  description?: string;
  brand: string;
  provider: string;
  quantity?: number;
  buyDate: string;
  category: Category;
  currentLocationType?: 'deposit' | 'construction' | 'worker' | null;
  currentLocationId?: number | null;
  location?: Location | null;
  architect: number | Architect;
  notes?: Note[];
  assignments?: WorkerElementAssignment[];
  createdAt?: string;
}

export interface WorkerElementAssignment {
  id: number;
  assignedAt: string;
  returnedAt: string | null;
  worker: ConstructionWorker;
  fromLocationType?: 'deposit' | 'construction' | 'worker' | null;
  fromLocationId?: number | null;
}

export interface ElementLocation {
  id: number;
  element: Element;
  deposit: Deposit | null;
  construction: Construction | null;
  construction_worker: ConstructionWorker | null;
  created_at?: string;
}

export interface ElementMoveDetail {
  id: number;
  element: Element;
  from_deposit: Deposit | null;
  to_deposit: Deposit | null;
  from_construction: Construction | null;
  to_construction: Construction | null;
  from_construction_worker: ConstructionWorker | null;
  to_construction_worker: ConstructionWorker | null;
  quantity: number;
  architect: Architect;
  created_at?: string;
}

export interface EventsHistory {
  id: number;
  table: string;
  action: string;
  actorId: number;
  actorType: string;
  oldData: any;
  newData: any;
  created_at?: string;
}

export interface Note {
  id: number;
  title: string;
  text: string;
  createdBy: number;
  createdByType: string;
  createdAt: string;
  context?: string | null;
  element?: Element | null;
  missing?: Missing | null;
  worker?: ConstructionWorker | null;
  architect?: Architect | null;
}

export type MissingStatus = 'SE_QUEDO_SIN' | 'SE_ROMPIO' | 'SE_PERDIO';

export interface Missing {
  id: number;
  title: string;
  text: string;
  status: MissingStatus;
  urgent: boolean;
  element: Element;
  construction: Construction | null;
  architect: Architect;
  constructionWorker: ConstructionWorker;
  notes?: Note[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ConstructionSnapshot {
  id: number;
  construction: Construction;
  data: any;
  created_at?: string;
}

export interface Location {
  id: number;
  createdAt: string;
  locationId: number;
  locationType: string;
  updatedAt: string;
}
