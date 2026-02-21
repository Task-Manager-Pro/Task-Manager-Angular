<h1 align="center">Todo List Angular/ TypeScript</h1>
<div align="center">
  <h3>Acompanhe a Produtividade do Projeto</h2>
  <a href="https://wakatime.com/badge/github/Romulo-Queiroz/Task-Manager-Frontend"><img align="center" src="https://wakatime.com/badge/github/Romulo-Queiroz/Task-Manager-Frontend.svg" alt="wakatime"></a>
  <p>Visão Geral do Tempo Investido</p>
</div>

#Sobre o projeto
* visualize como está o andamento do desenvolvimento das páginas <a href="./VISUALIZAR.md"> aqui </a>

<br />

# Dependências principais
* **Angular 16** – framework do projeto
* **@angular/cdk** – Angular CDK (drag-and-drop no quadro de tarefas)
* **@ng-bootstrap/ng-bootstrap** – componentes Bootstrap para Angular
* **@auth0/angular-jwt** – autenticação JWT

<br />

# Iniciando o projeto

## Rodando pela primeira vez

### Pré-requisitos
* **Node.js** (recomendado LTS) e **npm**
* **Angular CLI** (opcional, para usar `ng` no terminal)
* Ter o [Backend](https://github.com/Romulo-Queiroz/Todo) rodando na sua máquina

### 1. Clonar o repositório
```bash
git clone https://github.com/Romulo-Queiroz/todoListFront
cd todoListFront
```

### 2. Instalar dependências
Na raiz do projeto, execute:

```bash
npm install
```

Se aparecer erro de conflito de dependências (peer dependencies), use:

```bash
npm install --legacy-peer-deps
```

### 3. Subir a aplicação
```bash
npm start
```

ou, se tiver o Angular CLI instalado:

```bash
ng serve
```

A aplicação ficará disponível em **http://localhost:4200/**.

### 4. Backend
O frontend consome a API do backend. Clone e execute o backend antes de usar o projeto:

```bash
git clone https://github.com/Romulo-Queiroz/Todo
# Siga as instruções do repositório do backend para subir a API
```

---

## Comandos úteis
| Comando | Descrição |
|--------|-----------|
| `npm start` | Sobe o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `ng serve` | Sobe o servidor (requer Angular CLI) |

## Aviso
* Verifique se possui uma versão compatível do Angular CLI. Caso precise instalar ou atualizar:
  ```bash
  npm i -g @angular/cli@16
  ```
* Em caso de conflitos de dependências, use `npm install --legacy-peer-deps`.
# Autor
<div align="center">

| [<img src="https://github.com/Romulo-Queiroz.png?size=115" width=115><br><sub>@Romulo-Queiroz</sub>](https://github.com/Romulo-Queiroz) |
| :-------------------------------------------------------------------------------------------------------------------------------------: |

</div>
