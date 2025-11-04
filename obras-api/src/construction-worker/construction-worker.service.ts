// src/construction-worker/construction-worker.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionWorker } from 'src/shared/entities/construction-worker.entity';
import { CreateConstructionWorkerDto } from './dto/create-construction-worker.dto';
import { UpdateConstructionWorkerDto } from './dto/update-construction-worker.dto';
import { Construction } from 'src/shared/entities/construction.entity';
import * as bcrypt from 'bcryptjs';
import { EventsHistoryLoggerService } from 'src/shared/services/events-history/events-history-logger.service';

@Injectable()
export class ConstructionWorkerService {
  constructor(
    @InjectRepository(ConstructionWorker)
    private readonly workerRepo: Repository<ConstructionWorker>,

    @InjectRepository(Construction)
    private readonly constructionRepo: Repository<Construction>,

    private readonly logger: EventsHistoryLoggerService,
  ) {}

  async create(architectId: number, dto: CreateConstructionWorkerDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (dto.constructionId) {
      const construction = await this.constructionRepo.findOne({
        where: { id: dto.constructionId },
      });
      if (!construction)
        throw new NotFoundException('Construcción no encontrada');
    }

    const worker = this.workerRepo.create({
      name: dto.name,
      password: hashedPassword,
      architect: { id: architectId },
    });

    const saved = await this.workerRepo.save(worker);

    await this.logger.logEvent({
      table: 'construction_worker',
      recordId: saved.id,
      action: 'create',
      actorId: architectId,
      actorType: 'architect',
      newData: saved,
    });

    return saved;
  }

  async findAll(architectId: number) {
    return await this.workerRepo.find({
      where: { architect: { id: architectId } },
    });
  }

  async findOne(architectId: number, id: number) {
    const worker = await this.workerRepo.findOne({
      where: { id, architect: { id: architectId } },
    });

    if (!worker) throw new NotFoundException('Obrero no encontrado');
    return worker;
  }

  async update(
    architectId: number,
    id: number,
    dto: UpdateConstructionWorkerDto,
  ) {
    const worker = await this.findOne(architectId, id);
    if (!worker) throw new NotFoundException('Construcción no encontrada');

    const oldData = { ...worker };

    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }

    Object.assign(worker, {
      ...dto,
    });

    const updated = await this.workerRepo.save(worker);

    await this.logger.logEvent({
      table: 'construction_worker',
      recordId: updated.id,
      action: 'update',
      actorId: architectId,
      actorType: 'architect',
      oldData,
      newData: updated,
    });

    return updated;
  }

  async remove(architectId: number, id: number) {
    const worker = await this.findOne(architectId, id);
    return await this.workerRepo.remove(worker);
  }
}
