import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';

interface GuideSection {
  title: string;
  description: string;
  bullets: string[];
}

@Component({
  selector: 'app-admin-guide',
  standalone: true,
  imports: [CommonModule, CardModule, DividerModule],
  templateUrl: './admin-guide.html',
  styleUrl: './admin-guide.scss',
})
export class AdminGuide {
  sections: GuideSection[] = [
    {
      title: 'Inicio',
      description:
        'Un vistazo rápido al estado de tu empresa: cuántas obras, obreros, depósitos, elementos, notas y faltantes tenés activos. También muestra los últimos movimientos de inventario.',
      bullets: [
        'Los números grandes son totales en tiempo real.',
        'Los movimientos te cuentan quién movió cada elemento y hacia dónde se lo llevó.',
      ],
    },
    {
      title: 'Obras',
      description:
        'Administrá cada obra con su nombre y descripción. Desde aquí ingresás al detalle para ver la información de campo.',
      bullets: [
        'Crear una obra nueva para empezar a asignar recursos.',
        'Entrar al detalle para revisar la descripción y la fecha de alta.',
        'Eliminar una obra cuando dejó de estar activa.',
      ],
    },
    {
      title: 'Obreros',
      description:
        'Listado de personas que pueden entrar con usuario propio. Sirve para darles acceso y modificar sus datos.',
      bullets: [
        'Crear credenciales nuevas para sumar obreros.',
        'Editar nombres y contraseñas desde la tabla directa.',
        'Borrar un obrero si ya no pertenece a tu equipo.',
      ],
    },
    {
      title: 'Depósito',
      description:
        'Listado principal de elementos y materiales. Es la mesa de control del inventario.',
      bullets: [
        'Filtrar por categoría o ubicación para encontrar más fácil.',
        'Agregar, editar o eliminar elementos con sus datos principales.',
        'Abrir/crear las notas asociadas a cada elemento.',
      ],
    },
    {
      title: 'Notas',
      description:
        'Guardá comentarios, instrucciones o recordatorios ligados a cada elemento.',
      bullets: [
        'Ver todas las notas en formato limpio y legible.',
        'Editar o crear nuevas notas con el editor WYSIWYG.',
        'Cada nota queda ligada al elemento y registra quién la escribió.',
      ],
    },
    {
      title: 'Historial',
      description:
        'Caja negra de la plataforma: registra todos los movimientos importantes.',
      bullets: [
        'Filtrar por tabla, acción, persona o rango de fechas.',
        'Ver el detalle completo con la información vieja y nueva.',
        'Ideal para auditorías o para revisar qué se hizo en la semana.',
      ],
    },
    {
      title: 'Faltantes',
      description:
        'Panel para seguir qué herramientas o materiales faltan. Se alimenta con lo que reportan los obreros.',
      bullets: [
        'Los faltantes urgentes aparecen arriba con un símbolo rojo.',
        'Marcá “Listo” cuando el material volvió al depósito y el sistema mostrará una confirmación.',
        'Si algo se perdió, dejalo en pendiente para que quede constancia con el nombre del obrero.',
      ],
    },
    {
      title: 'Versión Obrero',
      description:
        'Cuando un obrero inicia sesión ve una versión simplificada con Elementos, Faltantes y Notas.',
      bullets: [
        'Elementos: consulta rápida de lo que tiene asignado.',
        'Faltantes: reporta problemas o herramientas que no devolvió.',
        'Notas: recibe instrucciones o deja comentarios desde campo.',
      ],
    },
  ];
}
