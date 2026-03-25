import { Component } from '@angular/core';
import { FooterPipe } from '../../pipes/footer.pipe';

@Component({
  selector: 'app-footer',
  imports: [FooterPipe],
  templateUrl: './footer.component.html',
  // styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly companyName = 'Acme Explorer, Inc';
}
