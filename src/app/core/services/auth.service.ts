import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../infrastructure/firebase.config';
import { AnyActor, Explorer } from '../../shared/actor.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);
  currentRole = signal<AnyActor['role'] | null>(null);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        const snap = await getDoc(doc(db, 'actors', user.uid));
        const data = snap.data() as Partial<AnyActor> | undefined;
        this.currentRole.set(data?.role ?? null);
      } else {
        this.currentRole.set(null);
      }
    });
  }

  async login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async register(actor: Omit<Explorer, 'id' | 'version'>) {
    const credential = await createUserWithEmailAndPassword(auth, actor.email, actor.password);
    const { password, ...rest } = actor;
    const actorDoc = Object.fromEntries(
      Object.entries({ ...rest, version: 0 }).filter(([, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'actors', credential.user.uid), actorDoc);
  }

  async logout() {
    await signOut(auth);
  }
}
