// src/modules/missing/missing.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Missing, MissingStatus } from '../shared/entities/missing.entity';
import { Repository } from 'typeorm';
import { CreateMissingDto } from './dto/create-missing.dto';
import { UpdateMissingDto } from './dto/update-missing.dto';
import { UpdateMissingStatusDto } from './dto/update-status.dto';
import { QueryMissingDto } from './dto/query-missing.dto';
import { Construction } from '../shared/entities/construction.entity';
import { Architect } from '../shared/entities/architect.entity';
import { ConstructionWorker } from '../shared/entities/construction-worker.entity';

interface AuthUser {
  id: number;
  role: 'WORKER' | 'ARCHITECT' | 'ADMIN';
  workerId?: number; // si role WORKER
  architectId?: number; // si role ARCHITECT
}

@Injectable()
export class MissingService {
  constructor(
    @InjectRepository(Missing) private repo: Repository<Missing>,
    @InjectRepository(Construction)
    private constructionRepo: Repository<Construction>,
    @InjectRepository(Architect) private architectRepo: Repository<Architect>,
    @InjectRepository(ConstructionWorker)
    private workerRepo: Repository<ConstructionWorker>,
  ) {}

  async findAll(q: QueryMissingDto) {
    const {
      page = 1,
      pageSize = 20,
      constructionId,
      architectId,
      status,
      urgent,
    } = q;

    const qb = this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.construction', 'construction')
      .leftJoinAndSelect('m.architect', 'architect')
      .leftJoinAndSelect('m.constructionWorker', 'worker')
      .where('1=1');

    if (constructionId)
      qb.andWhere('construction.id = :constructionId', { constructionId });
    if (architectId)
      qb.andWhere('architect.id = :architectId', { architectId });
    if (status) qb.andWhere('m.status = :status', { status });
    if (urgent === 'true' || urgent === 'false')
      qb.andWhere('m.urgent = :urgent', { urgent: urgent === 'true' });

    qb.orderBy('m.urgent', 'DESC')
      .addOrderBy('m.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, pageSize };
  }

  async findOne(id: number) {
    const missing = await this.repo.findOne({ where: { id } });
    if (!missing) throw new NotFoundException('Missing not found');
    return missing;
  }

  async create(dto: CreateMissingDto, user: AuthUser) {
    if (user.role !== 'WORKER' || !user.workerId) {
      throw new ForbiddenException('Sólo obreros pueden crear faltantes');
    }

    const [construction, architect, worker] = await Promise.all([
      this.constructionRepo.findOneByOrFail({ id: dto.constructionId }),
      this.architectRepo.findOneByOrFail({ id: dto.architectId }),
      this.workerRepo.findOneByOrFail({ id: user.workerId }),
    ]);

    const missing = this.repo.create({
      title: dto.title,
      text: dto.text,
      urgent: dto.urgent ?? false,
      status: MissingStatus.PENDING,
      construction,
      architect,
      constructionWorker: worker,
    });

    return this.repo.save(missing);
  }

  async updateByWorker(id: number, dto: UpdateMissingDto, user: AuthUser) {
    const missing = await this.findOne(id);
    if (
      user.role !== 'WORKER' ||
      user.workerId !== missing.constructionWorker.id
    ) {
      throw new ForbiddenException('No podés editar este faltante');
    }
    // No permitimos cambiar estado desde el obrero
    if (typeof (dto as any).status !== 'undefined') {
      throw new ForbiddenException('El estado sólo lo cambia el arquitecto');
    }

    Object.assign(missing, dto);
    return this.repo.save(missing);
  }

  async removeByWorker(id: number, user: AuthUser) {
    const missing = await this.findOne(id);
    if (
      user.role !== 'WORKER' ||
      user.workerId !== missing.constructionWorker.id
    ) {
      throw new ForbiddenException('No podés borrar este faltante');
    }
    await this.repo.softRemove(missing);
    return { success: true };
  }

  async updateStatusAsArchitect(
    id: number,
    dto: UpdateMissingStatusDto,
    user?: AuthUser,
  ) {
    const actor: AuthUser | null =
      user ??
      (dto.actorRole
        ? {
            id: dto.actorId ?? 0,
            role: dto.actorRole.toUpperCase() as AuthUser['role'],
            architectId:
              dto.actorRole.toUpperCase() === 'ARCHITECT'
                ? dto.actorId ?? undefined
                : undefined,
            workerId:
              dto.actorRole.toUpperCase() === 'WORKER'
                ? dto.actorId ?? undefined
                : undefined,
          }
        : null);

    const missing = await this.findOne(id);
    if (
      !actor ||
      actor.role !== 'ARCHITECT' ||
      actor.architectId !== missing.architect.id
    ) {
      throw new ForbiddenException(
        'Sólo el arquitecto asignado puede cambiar el estado',
      );
    }
    missing.status = dto.status;
    return this.repo.save(missing);
  }
}
