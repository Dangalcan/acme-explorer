import { Pipe, PipeTransform } from '@angular/core';

/** Returns a Tailwind text-color class that visually highlights trip availability. */
@Pipe({
  name: 'soldOutClass',
})
export class SoldOutClassPipe implements PipeTransform {
  transform(availablePlaces: number | null | undefined): string {
    if (availablePlaces === 0) return 'text-red-600 dark:text-red-400';
    if (typeof availablePlaces === 'number' && availablePlaces > 0) return 'text-green-600 dark:text-green-400';
    return 'text-slate-500 dark:text-slate-400';
  }
}
