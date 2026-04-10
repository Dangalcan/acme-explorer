import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AnyActor } from '../actor.model';

@Pipe({
  name: 'userRole',
  pure: false,
})
export class UserRolePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: AnyActor['role']): string {
    const key = `roles.${value}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : value;
  }
}
