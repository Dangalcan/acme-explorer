import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db, firebaseConfig } from '../../infrastructure/firebase.config';
import { AnyActor, Explorer, Manager } from '../../shared/actor.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser = signal<User | null>(null);
  currentRole = signal<AnyActor['role'] | null>(null);
  isAuthLoading = signal(true);

  readonly ready: Promise<void>;
  private readyResolve!: () => void;

  constructor() {
    this.ready = new Promise<void>(resolve => {
      this.readyResolve = resolve;
    });

    onAuthStateChanged(auth, async (user) => {
      this.isAuthLoading.set(true);
      this.currentUser.set(user);
      if (user) {
        const snap = await getDoc(doc(db, 'actors', user.uid));
        const data = snap.data() as Partial<AnyActor> | undefined;
        this.currentRole.set(data?.role ?? null);
      } else {
        this.currentRole.set(null);
      }
      this.isAuthLoading.set(false);
      this.readyResolve();
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

  async createManager(actor: Omit<Manager, 'id' | 'version'>) {
    const secondaryApp = initializeApp(firebaseConfig, `manager-creation-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const credential = await createUserWithEmailAndPassword(secondaryAuth, actor.email, actor.password);
      const { password, ...rest } = actor;
      const actorDoc = Object.fromEntries(
        Object.entries({ ...rest, version: 0 }).filter(([, v]) => v !== undefined)
      );
      await setDoc(doc(db, 'actors', credential.user.uid), actorDoc);
    } finally {
      await deleteApp(secondaryApp);
    }
  }

  async getActorData(): Promise<Partial<AnyActor> | null> {
    const user = this.currentUser();
    if (!user) return null;
    const snap = await getDoc(doc(db, 'actors', user.uid));
    return (snap.data() as Partial<AnyActor>) ?? null;
  }

  async updateActorProfile(data: {
    name: string;
    surname: string;
    phoneNumber?: string;
    address?: string;
  }): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('Not authenticated');
    const cleaned = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
    );
    await updateDoc(doc(db, 'actors', user.uid), cleaned);
  }

  async logout() {
    await signOut(auth);
  }
}
