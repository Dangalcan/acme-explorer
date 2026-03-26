import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'description',
})
export class DescriptionPipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength = 120): string {
    const text = (value ?? '').trim();

    if (!text) {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    const words = text.split(/\s+/);
    let result = '';

    for (const word of words) {
      const next = result ? `${result} ${word}` : word;

      if (next.length > maxLength) {
        break;
      }

      result = next;
    }

    if (!result) {
      return `${text.slice(0, maxLength).trimEnd()}...`;
    }

    return `${result}...`;
  }
}
