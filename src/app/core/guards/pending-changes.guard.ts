import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';

export interface ComponentCanDeactivate {
  canDeactivate: () => boolean | Observable<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<ComponentCanDeactivate> = (component) => {
  if (component.canDeactivate && !component.canDeactivate()) {
    return confirm(
      'WARNING: You have unsaved changes. Press Cancel to go back and save these changes, or OK to lose these changes.',
    );
  }

  return true;
};
