import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateCategoryService } from '../../Services/create-category.service';

@Component({
  selector: 'app-create-category',
  templateUrl: './create-category.component.html',
  styleUrls: ['./create-category.component.css']
})
export class CreateCategoryComponent {
  categoryForm: FormGroup;

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private router: Router,
    private createCategoryService: CreateCategoryService
  ) {
    this.categoryForm = this.formBuilder.group({
      categoryName: ['', Validators.required],
      categoryDescription: ['']
    });
  }

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user !== null) {
      const userData = JSON.parse(user);
      console.log("Em create-category.component.ts: tenho user = ", userData);
    }
  }

  createCategory() {
    if (this.categoryForm.invalid) {
      return;
    }

    const newCategory = {
      name: this.categoryForm.value.categoryName,
      description: this.categoryForm.value.categoryDescription || ''
    };

    console.log('Criando categoria:', newCategory);

    this.createCategoryService.createCategory(newCategory).subscribe(
      (response) => {
        console.log('Categoria criada com sucesso:', response);
        this.categoryForm.reset();
        // Redirecionar para a lista de tarefas após criar com sucesso
        this.router.navigate(['/tasks']);
      },
      (error) => {
        console.error('Erro ao criar a categoria:', error);
        alert('Erro ao criar a categoria. Por favor, tente novamente.');
      }
    );
  }
}

