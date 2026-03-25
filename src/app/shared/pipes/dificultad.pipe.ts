import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dificultad',
})
export class DificultadPipe implements PipeTransform {
  private readonly labels: Record<string, string> = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
  };

  transform(value: string | null | undefined): string {
    if (!value) {
      return 'Unknown';
    }

    return this.labels[value] ?? value;
  }
}
