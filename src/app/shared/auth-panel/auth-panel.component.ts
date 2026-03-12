import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-panel',
  imports: [],
  templateUrl: './auth-panel.component.html',
  styleUrl: './auth-panel.component.scss',
})
export class AuthPanelComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  async goToLogin() {
    await this.router.navigateByUrl('/login');
  }

  async logout() {
    await this.authService.logout();
  }
}