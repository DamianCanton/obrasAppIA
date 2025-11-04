import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Menu } from 'primeng/menu';
import { CommonModule } from '@angular/common';
import { Drawer } from 'primeng/drawer';
import { AuthService } from '../../services/auth.service';
import { DrawerVisibility } from '../../services/drawer_visibility.service';

function withCloseCommand(items: MenuItem[], onClick: () => void): MenuItem[] {
  return items.map((i) => ({
    ...i,
    command: i.command ?? onClick,
    ...(i.items ? { items: withCloseCommand(i.items, onClick) } : {}),
  }));
}

@Component({
  selector: 'app-menu',
  standalone: true,
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
  imports: [Menu, CommonModule],
})
export class MenuComponent implements OnInit, OnDestroy {
  items: MenuItem[] = [];
  activePath = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private drawer = inject(DrawerVisibility);

  private navSub!: Subscription;

  ngOnInit() {
    this.setItems(this.router.url);

    this.navSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.setItems(e.urlAfterRedirects);
        this.drawer.closeSidebar(); // cerrar siempre al navegar
      });
  }

  ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  private setItems(currentPath: string) {
    this.activePath = currentPath;

    const rawItems: MenuItem[] = [
      { label: 'Inicio', icon: 'pi pi-home', routerLink: [''] },
      {
        label: 'Trabajadores',
        icon: 'pi pi-users',
        routerLink: ['construction-workers'],
      },
      {
        label: 'Obras',
        icon: 'pi pi-briefcase',
        routerLink: ['constructions'],
      },
      { label: 'Depósito', icon: 'pi pi-box', routerLink: ['deposit'] },
      { label: 'Historial', icon: 'pi pi-calendar', routerLink: ['events'] },
      { label: 'Notas', icon: 'pi pi-book', routerLink: ['notes'] },
      ...(this.isAdminUser()
        ? [
            {
              label: 'Guía del panel',
              icon: 'pi pi-info-circle',
              routerLink: ['admin-guide'],
            } as MenuItem,
          ]
        : []),
      {
        label: 'Salir',
        icon: 'pi pi-sign-out',
        command: () => this.confirmLogout(),
      },
    ];

    const withActive = (items: MenuItem[]): MenuItem[] =>
      items.map((i) => {
        const url =
          typeof i.routerLink === 'string'
            ? i.routerLink
            : Array.isArray(i.routerLink)
            ? '/' + i.routerLink.filter(Boolean).join('/')
            : '';

        const isActive =
          !!url &&
          (this.activePath === url ||
            this.activePath === '/' + url.replace(/^\//, '') ||
            this.activePath.startsWith(url + '/'));

        return {
          ...i,
          styleClass: [i.styleClass, isActive ? 'active' : '']
            .filter(Boolean)
            .join(' '),
          items: i.items ? withActive(i.items) : undefined,
        };
      });

    // autocierre + activo
    this.items = withActive(
      withCloseCommand(rawItems, () => this.drawer.closeSidebar())
    );
  }

  private isAdminUser() {
    const email = this.authService.user()?.email?.toLowerCase();
    return email === 'fede@ejemplo';
  }

  private confirmLogout() {
    this.drawer.closeSidebar();
    const confirmed = window.confirm(
      '¿Seguro que querés salir de la aplicación?'
    );
    if (!confirmed) return;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
