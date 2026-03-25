import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCurrency',
})
export class AppCurrencyPipe implements PipeTransform {
  transform(
    value: number | null | undefined,
    currencyCode = 'EUR',
    locale = 'en-US',
  ): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
