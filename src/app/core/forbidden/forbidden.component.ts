import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-forbidden',
  imports: [TranslatePipe],
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent {}
