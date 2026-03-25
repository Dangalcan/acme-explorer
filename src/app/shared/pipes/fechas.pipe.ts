import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechas',
})
export class FechasPipe implements PipeTransform {
  transform(
    value: Date | string | number | null | undefined,
    format = 'd MMM yyyy',
    locale = 'en-US',
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    return formatDate(value, format, locale);
  }
}
