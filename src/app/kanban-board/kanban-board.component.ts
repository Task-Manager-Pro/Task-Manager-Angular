import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, map, of, takeUntil } from 'rxjs';
import { TaskApiService } from 'src/Services/task-api.service';
import { BoardColumnDto, TaskDto } from 'src/Interfaces/task-dto.interface';

interface BoardColumnViewModel extends BoardColumnDto {
  tasks: TaskDto[];
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-kanban-board',
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.css']
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  boardId = 1;
  columns: BoardColumnViewModel[] = [];
  taskForm: FormGroup;
  selectedTaskId: number | null = null;
  feedbackMessage = '';
  feedbackType: 'success' | 'danger' | 'warning' = 'success';

  savingStateByTask: Record<number, SaveState> = {};
  pendingMoveTaskIds = new Set<number>();
  draggingTaskId: number | null = null;

  private taskIndex = new Map<number, TaskDto>();
  private lastPersistedFormValue: Partial<TaskDto> = {};
  private destroy$ = new Subject<void>();

  constructor(
    private readonly taskApiService: TaskApiService,
    private readonly formBuilder: FormBuilder
  ) {
    this.taskForm = this.formBuilder.group({
      title: [''],
      description: [''],
      estimateMinutes: [null],
      spentMinutes: [null],
      dueDate: [null]
    });
  }

  ngOnInit(): void {
    this.loadBoard();
    this.initializeAutosave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByColumnId(_: number, column: BoardColumnViewModel): string {
    return column.id;
  }

  trackByTaskId(_: number, task: TaskDto): number {
    return task.id;
  }

  selectTask(task: TaskDto): void {
    this.selectedTaskId = task.id;
    const taskValue = this.getEditableFields(task);
    this.lastPersistedFormValue = taskValue;
    this.taskForm.patchValue(taskValue, { emitEvent: false });
  }

  onDragStart(task: TaskDto): void {
    if (this.pendingMoveTaskIds.has(task.id)) {
      return;
    }

    this.draggingTaskId = task.id;
  }

  onDrop(targetColumnId: string, targetIndex: number): void {
    if (this.draggingTaskId === null) {
      return;
    }

    const source = this.findTaskPosition(this.draggingTaskId);
    if (!source) {
      this.draggingTaskId = null;
      return;
    }

    if (this.pendingMoveTaskIds.has(this.draggingTaskId)) {
      this.draggingTaskId = null;
      return;
    }

    const snapshot = this.cloneColumns();
    const sourceColumn = this.columns[source.columnIndex];
    const [movedTask] = sourceColumn.tasks.splice(source.taskIndex, 1);
    const destinationColumnIndex = this.columns.findIndex((column) => column.id === targetColumnId);

    if (!movedTask || destinationColumnIndex === -1) {
      this.columns = snapshot;
      this.draggingTaskId = null;
      return;
    }

    const destinationColumn = this.columns[destinationColumnIndex];
    const normalizedIndex = Math.max(0, Math.min(targetIndex, destinationColumn.tasks.length));
    destinationColumn.tasks.splice(normalizedIndex, 0, movedTask);

    this.recalculateColumnOrder(sourceColumn.id);
    if (sourceColumn.id !== destinationColumn.id) {
      this.recalculateColumnOrder(destinationColumn.id);
    }

    movedTask.columnId = destinationColumn.id;
    movedTask.order = normalizedIndex;

    this.pendingMoveTaskIds.add(movedTask.id);
    this.taskApiService.moveTask(movedTask.id, destinationColumn.id, movedTask.order, movedTask.rowVersion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedTask) => {
          this.pendingMoveTaskIds.delete(movedTask.id);
          this.applyServerTask(updatedTask);
        },
        error: () => {
          this.pendingMoveTaskIds.delete(movedTask.id);
          this.columns = snapshot;
          this.rebuildTaskIndex();
          this.showFeedback('Não foi possível mover a tarefa. Estado restaurado.', 'danger');
        }
      });

    this.draggingTaskId = null;
  }

  getSavingState(taskId: number): SaveState {
    return this.savingStateByTask[taskId] ?? 'idle';
  }

  isTaskMovePending(taskId: number): boolean {
    return this.pendingMoveTaskIds.has(taskId);
  }

  private loadBoard(): void {
    this.taskApiService.getBoardTasks(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (board) => {
          this.columns = [...board.columns]
            .sort((a, b) => a.order - b.order)
            .map((column) => ({
              ...column,
              tasks: board.tasks
                .filter((task) => task.columnId === column.id)
                .sort((a, b) => a.order - b.order)
            }));
          this.rebuildTaskIndex();
        },
        error: () => {
          this.showFeedback('Falha ao carregar o board.', 'danger');
        }
      });
  }

  private initializeAutosave(): void {
    this.taskForm.valueChanges.pipe(
      debounceTime(800),
      map((formValue) => this.normalizeFormValue(formValue)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      map((normalized) => this.diffPatch(this.lastPersistedFormValue, normalized)),
      filter((patch) => Object.keys(patch).length > 0),
      takeUntil(this.destroy$)
    ).subscribe((patch) => {
      if (!this.selectedTaskId) {
        return;
      }

      const task = this.taskIndex.get(this.selectedTaskId);
      if (!task) {
        return;
      }

      this.savingStateByTask[task.id] = 'saving';
      this.taskApiService.patchTask(task.id, patch, task.rowVersion).pipe(
        takeUntil(this.destroy$),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 409) {
            this.savingStateByTask[task.id] = 'error';
            this.showFeedback('Essa tarefa foi atualizada em outro lugar.', 'warning');
            this.reloadTask(task.id);
            return of(null);
          }

          this.savingStateByTask[task.id] = 'error';
          this.showFeedback('Falha ao salvar alteração da tarefa.', 'danger');
          return of(null);
        })
      ).subscribe((updatedTask) => {
        if (!updatedTask) {
          return;
        }

        this.applyServerTask(updatedTask);
        this.lastPersistedFormValue = this.getEditableFields(updatedTask);
        this.savingStateByTask[updatedTask.id] = 'saved';
        setTimeout(() => {
          if (this.savingStateByTask[updatedTask.id] === 'saved') {
            this.savingStateByTask[updatedTask.id] = 'idle';
          }
        }, 900);
      });
    });
  }

  private reloadTask(taskId: number): void {
    this.taskApiService.getTaskById(taskId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          this.applyServerTask(task);
          if (this.selectedTaskId === taskId) {
            this.lastPersistedFormValue = this.getEditableFields(task);
            this.taskForm.patchValue(this.lastPersistedFormValue, { emitEvent: false });
          }
        }
      });
  }

  private applyServerTask(updatedTask: TaskDto): void {
    const taskPosition = this.findTaskPosition(updatedTask.id);
    if (!taskPosition) {
      return;
    }

    const existingTask = this.columns[taskPosition.columnIndex].tasks[taskPosition.taskIndex];
    this.columns[taskPosition.columnIndex].tasks[taskPosition.taskIndex] = {
      ...existingTask,
      ...updatedTask
    };

    this.rebuildTaskIndex();
  }

  private rebuildTaskIndex(): void {
    this.taskIndex.clear();
    this.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        this.taskIndex.set(task.id, task);
      });
    });
  }

  private findTaskPosition(taskId: number): { columnIndex: number; taskIndex: number } | null {
    for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
      const taskIndex = this.columns[columnIndex].tasks.findIndex((task) => task.id === taskId);
      if (taskIndex !== -1) {
        return { columnIndex, taskIndex };
      }
    }

    return null;
  }

  private recalculateColumnOrder(columnId: string): void {
    const column = this.columns.find((value) => value.id === columnId);
    if (!column) {
      return;
    }

    column.tasks = column.tasks.map((task, index) => ({
      ...task,
      order: index,
      columnId
    }));
  }

  private cloneColumns(): BoardColumnViewModel[] {
    return this.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task) => ({ ...task }))
    }));
  }

  private showFeedback(message: string, type: 'success' | 'danger' | 'warning'): void {
    this.feedbackMessage = message;
    this.feedbackType = type;
    setTimeout(() => {
      if (this.feedbackMessage === message) {
        this.feedbackMessage = '';
      }
    }, 3000);
  }

  private normalizeFormValue(formValue: unknown): Partial<TaskDto> {
    const value = formValue as {
      title?: string;
      description?: string;
      estimateMinutes?: number | null;
      spentMinutes?: number | null;
      dueDate?: string | null;
    };

    return {
      title: value.title?.trim() ?? '',
      description: value.description?.trim() ?? '',
      estimateMinutes: value.estimateMinutes ?? null,
      spentMinutes: value.spentMinutes ?? null,
      dueDate: value.dueDate ?? null
    };
  }

  private getEditableFields(task: TaskDto): Partial<TaskDto> {
    return {
      title: task.title,
      description: task.description,
      estimateMinutes: task.estimateMinutes ?? null,
      spentMinutes: task.spentMinutes ?? null,
      dueDate: task.dueDate ?? null
    };
  }

  private diffPatch(previous: Partial<TaskDto>, current: Partial<TaskDto>): Partial<TaskDto> {
    const patch: Partial<TaskDto> = {};

    (Object.keys(current) as Array<keyof TaskDto>).forEach((key) => {
      if (current[key] !== previous[key]) {
        patch[key] = current[key] as never;
      }
    });

    return patch;
  }
}
