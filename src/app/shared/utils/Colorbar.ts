import chroma from "chroma-js";
import { legendGrades, legendLabels, legendTitle } from 'src/app/shared/desctiptions/service-desctiptions';
export class LegendUtils {
  static generateLegend(service: string): string {
    const grades = legendGrades[service];
    const grade_min = grades[1];
    const grade_max = grades[grades.length - 2];
    const labels: string[] = legendLabels[service];
    let legendHtml = `<p align="center" class="legend-title">${legendTitle[service]}</p>`;
    for (let i = 0; i < grades.length - 1; i++) {
      const from = grades[i];
      const color = chroma.scale(["red", "white", "blue"]).domain([grade_min, grade_max])(from).hex();
      if (i === 0) {
        legendHtml += ` <i style="background:${color}"></i> <span class="legend-label">${labels[i]}</span><br>`;
      } else if (i === grades.length - 2) {
        legendHtml += ` <i style="background:${color}"></i> <span class="legend-label">${labels[i + 1]}</span><br>`;
      } else {
        legendHtml += ` <i style="background:${color}"></i> <span class="legend-label">${labels[i]} , ${labels[i + 1]}</span><br>`;
      }
    }
    return legendHtml;
  }
}

