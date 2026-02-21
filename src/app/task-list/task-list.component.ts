import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateTaskComponent } from '../create-task/create-task.component';
import { ConfirmationModalComponent } from '../confirmation-modal/confirmation-modal.component';
import { UpdateTodoComponent } from '../update-todo/update-todo.component';
import { ListTaskByUserService } from 'src/Services/list-task-by-user.service';
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
  draggingTaskId: number | null = null;

  constructor(
    private modalService: NgbModal,
    private markTaskAsUndoneService: MarkTaskAsUndoneService,
    private listTaskByUser: ListTaskByUserService
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

    this.listTaskByUser.listTaskByUserId(this.user.id).subscribe(
      (response) => {
        if (response && response.value && Array.isArray(response.value)) {
          this.pendingTasks = response.value.filter((task) => !task.done);
          this.doneTasks = response.value.filter((task) => task.done);
        } else {
          console.error('Resposta do servidor inválida:', response);
        }
      },
      (error) => {
        console.error('Erro ao listar as tarefas:', error);
      }
    );
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
      () => this.loadTasks(),
      (error) => {
        console.error('Erro ao marcar a tarefa como concluída:', error);
      }
    );
  }

  onDragStart(taskId: number) {
    this.draggingTaskId = taskId;
  }

  onDropDone() {
    if (this.draggingTaskId !== null) {
      this.markTaskAsDone(this.draggingTaskId);
      this.draggingTaskId = null;
    }
  }

  clearDraggingTask() {
    this.draggingTaskId = null;
  }
}
