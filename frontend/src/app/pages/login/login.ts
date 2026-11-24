import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { readApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { AuthResponse } from '../../core/models';
import { ThemeService } from '../../core/theme.service';
import { BudgetRing } from '../../shared/budget-ring';
import { CategoryIcon } from '../../shared/category-icon';
import { CountUp } from '../../shared/count-up';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Logo, CountUp, CategoryIcon, BudgetRing],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  host: {
    '(pointermove)': 'track($event)',
    '[style.--px]': 'pointer().x',
    '[style.--py]': 'pointer().y',
  },
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly theme = inject(ThemeService);

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly loading = signal<'login' | 'register' | 'guest' | 'demo' | null>(null);
  protected readonly error = signal<string | null>(null);
  /** Posição do ponteiro de -1 a 1: move os cartões de fundo em camadas (paralaxe). */
  protected readonly pointer = signal({ x: 0, y: 0 });
  /** O saldo de exemplo "conta" até o valor depois que a página abre. */
  protected readonly sample = signal(0);

  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
  });

  constructor() {
    setTimeout(() => this.sample.set(2591.88), 250);
  }

  protected track(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    this.pointer.set({
      x: (event.clientX / innerWidth) * 2 - 1,
      y: (event.clientY / innerHeight) * 2 - 1,
    });
  }

  switchMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.error.set(null);
  }

  login(): void {
    if (this.loginForm.invalid) return this.loginForm.markAllAsTouched();
    const { email, password } = this.loginForm.getRawValue();
    this.run('login', this.auth.login(email, password));
  }

  register(): void {
    if (this.registerForm.invalid) return this.registerForm.markAllAsTouched();
    const { name, email, password } = this.registerForm.getRawValue();
    this.run('register', this.auth.register(name, email, password));
  }

  guest(): void {
    this.run('guest', this.auth.guest());
  }

  demo(): void {
    this.run('demo', this.auth.demo());
  }

  private run(
    kind: 'login' | 'register' | 'guest' | 'demo',
    request: Observable<AuthResponse>,
  ): void {
    this.loading.set(kind);
    this.error.set(null);
    request.subscribe({
      next: () => void this.router.navigate(['/']),
      error: (e: unknown) => {
        this.loading.set(null);
        this.error.set(readApiError(e).message);
      },
    });
  }
}
