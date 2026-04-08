import { formatDate } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_TO_LOCALE: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
};

@Pipe({
  name: 'fechas',
  pure: false,
})
export class FechasPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(
    value: Date | string | number | null | undefined,
    format = 'd MMM yyyy',
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const lang = this.translate.currentLang ?? this.translate.getDefaultLang() ?? 'en';
    const locale = LANG_TO_LOCALE[lang] ?? 'en-US';

    return formatDate(value, format, locale);
  }
}
