import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CreateTaskComponent } from '../create-task/create-task.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { UpdateTodoComponent } from '../update-todo/update-todo.component';
import { ListTaskByUserService } from 'src/Services/list-task-by-user.service';
import { TasksToDoService } from 'src/Services/tasks-to-do.service';
import { MarkTaskAsUndoneService } from '../../Services/mark-task-done.service';
import { userModel } from 'src/Models/user.model';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  pendingTasks: any[] = [];
  doneTasks: any[] = [];
  user: userModel = new userModel();

  constructor(
    private modalService: NgbModal,
    private markTaskAsUndoneService: MarkTaskAsUndoneService,
    private listTaskByUser: ListTaskByUserService,
    private tasksToDoService: TasksToDoService
  ) {}

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    const user = localStorage.getItem('user');

    if (user) {
      this.user = JSON.parse(user);
    }

    if (!this.user.id) {
      return;
    }

    const tasksToDo$ = this.tasksToDoService.getTasksToDo().pipe(
      map((response) => {
        const list = Array.isArray(response) ? response : response?.value;
        return list && Array.isArray(list) ? list : [];
      }),
      catchError((err) => {
        console.error('Erro ao listar tarefas a fazer (GET /TasksToDo):', err);
        return of([]);
      })
    );

    const tasksByUser$ = this.listTaskByUser.listTaskByUserId(this.user.id).pipe(
      map((response) => {
        if (response?.value && Array.isArray(response.value)) {
          return response.value.filter((task: any) => task.done);
        }
        return [];
      }),
      catchError((err) => {
        console.error('Erro ao listar tarefas concluídas:', err);
        return of([]);
      })
    );

    forkJoin({
      pending: tasksToDo$,
      done: tasksByUser$
    }).subscribe(({ pending, done }) => {
      this.pendingTasks = pending;
      this.doneTasks = done;
    });
  }

  openCreateTaskModal() {
    this.modalService.open(CreateTaskComponent).closed.subscribe(() => this.loadTasks());
  }

  openConfirmationModal(taskId: number) {
    const modalRef = this.modalService.open(ConfirmationModalComponent);
    modalRef.componentInstance.taskId = taskId;
    modalRef.closed.subscribe(() => this.loadTasks());
  }

  openUpdateTaskModal(taskId: number) {
    const modalRef = this.modalService.open(UpdateTodoComponent);
    modalRef.componentInstance.taskId = taskId;
    modalRef.closed.subscribe(() => this.loadTasks());
  }

  markTaskAsDone(taskId: number) {
    this.markTaskAsUndoneService.markTaskAsDone(taskId).subscribe(
      () => {},
      (error) => {
        console.error('Erro ao marcar a tarefa como concluída:', error);
        this.loadTasks();
      }
    );
  }

  markTaskAsUndone(taskId: number) {
    this.markTaskAsUndoneService.markTaskAsUndone(taskId).subscribe(
      () => {},
      (error) => {
        console.error('Erro ao marcar a tarefa como não concluída:', error);
        this.loadTasks();
      }
    );
  }

  onDrop(event: CdkDragDrop<any[]>) {
    if (event.previousContainer === event.container) {
      return;
    }
    const task = event.item.data as { taskId: number; done: boolean };
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    if (event.container.id === 'doneList') {
      this.markTaskAsDone(task.taskId);
    } else {
      this.markTaskAsUndone(task.taskId);
    }
  }
}
