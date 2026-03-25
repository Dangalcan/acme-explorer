import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'footer',
})
export class FooterPipe implements PipeTransform {
  transform(companyName: string | null | undefined, year = new Date().getFullYear()): string {
    const normalized = (companyName ?? '').trim();

    if (!normalized) {
      return `© ${year}`;
    }

    return `© ${year} ${normalized}. All rights reserved`;
  }
}
