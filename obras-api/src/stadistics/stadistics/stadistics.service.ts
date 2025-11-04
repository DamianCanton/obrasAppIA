import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { Construction } from 'src/shared/entities/construction.entity';
import { ConstructionWorker } from 'src/shared/entities/construction-worker.entity';
import { Deposit } from 'src/shared/entities/deposit.entity';
import { Element } from 'src/shared/entities/element.entity';
import { Note } from 'src/shared/entities/note.entity';
import { Missing } from 'src/shared/entities/missing.entity';
import { EventsHistory } from 'src/shared/entities/events-history.entity';

@Injectable()
export class StadisticsService {
  constructor(
    @InjectRepository(Construction)
    private readonly constructionRepo: Repository<Construction>,
    @InjectRepository(ConstructionWorker)
    private readonly workerRepo: Repository<ConstructionWorker>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    @InjectRepository(Element)
    private readonly elementRepo: Repository<Element>,
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    @InjectRepository(Missing)
    private readonly missingRepo: Repository<Missing>,
    @InjectRepository(EventsHistory)
    private readonly eventsRepo: Repository<EventsHistory>,
  ) {}

  async getForArchitect(architectId: number) {
    // Big numbers en paralelo
    const [constructions, workers, deposits, elements, notes, missings] =
      await Promise.all([
        this.constructionRepo.count({
          where: { architect: { id: architectId } },
        }),
        this.workerRepo.count({ where: { architect: { id: architectId } } }),
        this.depositRepo.count({ where: { architect: { id: architectId } } }),
        this.elementRepo.count({ where: { architect: { id: architectId } } }),
        this.noteRepo.count({
          where: { createdBy: architectId, createdByType: 'architect' as any },
        }),
        this.missingRepo.count({ where: { architect: { id: architectId } } }),
      ]);

    // Últimos 5 movimientos (events_history)
    // ⚠️ Usa SOLO tableName (tu DB no tiene 'table')
    const lastMoves = await this.eventsRepo
      .createQueryBuilder('ev')
      .innerJoin(Element, 'el', 'el.id = ev."recordId"')
      .innerJoin('el.architect', 'arch')
      .where('arch.id = :architectId', { architectId })
      .andWhere('ev."tableName" = :tbl', { tbl: 'element' })
      .andWhere(
        new Brackets((qb) => {
          qb.where('ev."action" = :rawMove', { rawMove: 'move' })
            .orWhere('ev."action" ILIKE :moveLabel', {
              moveLabel: 'Elemento movido%',
            });
        }),
      )
      .orderBy('ev."createdAt"', 'DESC')
      .limit(5)
      .getMany();

    const normalize = (value: any) => {
      if (!value) return null;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    };

    return {
      counts: {
        constructions,
        workers,
        deposits,
        elements,
        notes,
        missings,
      },
      last5Moves: lastMoves.map((e: any) => ({
        id: e.id,
        elementId: e.recordId,
        when: e.createdAt,
        // Soporta ambos nombres según tu logger
        actorId: e.changedBy ?? e.actorId ?? null,
        actorType: e.changedByType ?? e.actorType ?? null,
        from: normalize(e.oldData),
        to: normalize(e.newData),
        action: e.action,
      })),
    };
  }
}
