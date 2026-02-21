import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UpdateCreateTasksService } from '../../Services/update-create-tasks.service';
import { CreateCategoryService } from '../../Services/create-category.service';

@Component({
  selector: 'app-create-task',
  templateUrl: './create-task.component.html',
  styleUrls: ['./create-task.component.css']
})
export class CreateTaskComponent implements OnInit {
  taskForm: FormGroup;
  categories: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    public activeModal: NgbActiveModal,
    private updateCreateTasksService: UpdateCreateTasksService,
    private createCategoryService: CreateCategoryService
  ) {
    this.taskForm = this.formBuilder.group({
      taskTitle: ['', Validators.required],
      taskDescription: ['', Validators.required],
      taskCategory: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.createCategoryService.getCategories().subscribe({
      next: (list) => {
        this.categories = list || [];
        if (this.categories.length > 0 && !this.taskForm.value.taskCategory) {
          const first = this.categories[0];
          this.taskForm.patchValue({ taskCategory: first.id ?? first.Id ?? first.categorieTaskId });
        }
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss();
  }

  createTask() {
    if (this.taskForm.invalid) {
      return;
    }
    const categoryId = Number(this.taskForm.value.taskCategory);
    if (!categoryId) {
      console.error('Selecione uma categoria válida.');
      return;
    }
    const newTask = {
      Title: this.taskForm.value.taskTitle,
      Description: this.taskForm.value.taskDescription,
      CategorieTaskId: categoryId
    };

    this.updateCreateTasksService.createTask(newTask).subscribe({
      next: (response) => {
        if (response) {
          this.activeModal.close('created');
        } else {
          console.error('Erro ao criar a tarefa:', response);
        }
      },
      error: (err) => {
        console.error('Erro ao criar a tarefa:', err);
      }
    });
  }

}
