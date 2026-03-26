import { Pipe, PipeTransform } from '@angular/core';
import { AnyActor } from '../actor.model';

@Pipe({
  name: 'userRole',
})
export class UserRolePipe implements PipeTransform {
  private readonly labels: Record<AnyActor['role'], string> = {
    administrator: $localize`Administrator`,
    manager:       $localize`Manager`,
    explorer:      $localize`Explorer`,
  };

  transform(value: AnyActor['role']): string {
    return this.labels[value] ?? value;
  }
}
