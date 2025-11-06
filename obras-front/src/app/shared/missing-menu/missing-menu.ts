import { Component, Input, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { MissingsService } from '../../services/missings.service';

@Component({
  selector: 'app-missing-menu',
  standalone: true,
  imports: [CommonModule, ButtonModule, DrawerModule, MessageModule, TagModule],
  templateUrl: './missing-menu.html',
  styleUrl: './missing-menu.scss',
})
export class MissingMenu implements OnInit {
  private router = inject(Router);
  svc = inject(MissingsService);

  @Input() architectId!: number; // pásalo desde el layout o auth
  @Input() constructionId?: number; // opcional para filtrar por obra

  visible = false;
  missings = this.svc.missings;
  totalCount = computed(() => this.missings().length);
  urgentCount = computed(() => this.missings().filter((m) => m.urgent).length);
  urgentMissings = computed(() =>
    this.missings().filter((m) => m.urgent),
  );

  ngOnInit(): void {
    if (this.architectId) {
      this.svc
        .initForArchitect(this.architectId, this.constructionId)
        .subscribe();
    }
  }

  openDrawer() {
    this.visible = true;
  }

  refresh() {
    this.svc.refresh().subscribe();
  }

  goToRegistry() {
    this.visible = false;
    this.router.navigate(['/missings']);
  }
}
