import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Note } from 'src/shared/entities/note.entity';
import { Element } from 'src/shared/entities/element.entity';
import { EventsHistoryLoggerService } from 'src/shared/services/events-history/events-history-logger.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { DeleteNoteDto } from './dto/delete-note.dto';

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepo: Repository<Note>,
    @InjectRepository(Element)
    private readonly elementRepo: Repository<Element>,
    private readonly logger: EventsHistoryLoggerService,
  ) {}

  async create(dto: CreateNoteDto) {
    const element = await this.elementRepo.findOne({
      where: { id: dto.elementId },
    });
    if (!element) throw new NotFoundException('Elemento no encontrado');

    const note = this.noteRepo.create({
      title: dto.title,
      text: dto.text,
      element,
      createdBy: dto.createdBy,
      createdByType: dto.createdByType,
    });
    const saved = await this.noteRepo.save(note);

    await this.logger.logEvent({
      table: 'note',
      recordId: saved.id,
      action: 'create',
      actorId: dto.createdBy,
      actorType: dto.createdByType as 'architect' | 'worker',
      newData: saved,
    });

    return this.noteRepo.findOne({
      where: { id: saved.id },
      relations: ['element'],
    });
  }

  async findByElement(elementId: number) {
    return this.noteRepo.find({
      where: { element: { id: elementId } },
      relations: ['element'],
    });
  }

  async findByArchitect(architectId: number) {
    return this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.element', 'element')
      .leftJoin('element.architect', 'architect')
      .where('architect.id = :architectId', { architectId })
      .getMany();
  }

  async update(id: number, dto: UpdateNoteDto) {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');

    const before = { ...note };
    note.title = dto.title;
    note.text = dto.text;
    const saved = await this.noteRepo.save(note);

    await this.logger.logEvent({
      table: 'note',
      recordId: saved.id,
      action: 'update',
      actorId: dto.updatedBy,
      actorType: dto.updatedByType as 'architect' | 'worker',
      oldData: before,
      newData: saved,
    });

    return saved;
  }

  async delete(id: number, dto: DeleteNoteDto) {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Nota no encontrada');

    // Desasociar por si el FK no tiene ON DELETE SET NULL
    await this.elementRepo
      .createQueryBuilder()
      .update(Element)
      .set({ note: null })
      .where('note_id = :id', { id })
      .execute();

    await this.noteRepo.remove(note);

    await this.logger.logEvent({
      table: 'note',
      recordId: note.id,
      action: 'delete',
      actorId: dto.deletedBy,
      actorType: dto.deletedByType as 'architect' | 'worker',
      oldData: note,
    });

    return { deleted: true };
  }
}
