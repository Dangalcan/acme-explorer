import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/layout/header/header.component';
import { FooterComponent } from './shared/layout/footer/footer.component';
import { LanguageService } from './core/services/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('acme-explorer');
  protected router = inject(Router);
  private languageService = inject(LanguageService);

  ngOnInit(): void {
    this.languageService.init();
  }
}
