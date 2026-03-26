import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatButtonModule, MatMenuModule],
  templateUrl: './header.component.html',
  // styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  router = inject(Router);

  currentUser = this.authService.currentUser;
  currentRole = this.authService.currentRole;

  async goToLogin() {
    await this.router.navigateByUrl('/login');
  }

  async logout() {
    await this.authService.logout();
    await this.router.navigateByUrl('/');
  }
}