import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { Chart } from 'chart.js/auto';


@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent {

   ngOnInit(): void {
    this.createChart();
    this.createChartBar();
  }

  createChart() {
    const ctx = document.getElementById('myChart') as HTMLCanvasElement;
    const myChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Categoria 1', 'Categoria 2', 'Categoria 3'],
        datasets: [{
          data: [30, 50, 20],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
      }
    });
  }

  createChartBar() {
    const ctx = document.getElementById('myChartBar') as HTMLCanvasElement;
    const myChartBar = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Categoria 1', 'Categoria 2', 'Categoria 3'],
        datasets: [{
          label: 'Dados',
          data: [30, 50, 20],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
      }
    });
  }
  
}