import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../infrastructure/firebase.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);

  constructor() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser.set(user);
    });
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout() {
    await signOut(auth);
  }
}