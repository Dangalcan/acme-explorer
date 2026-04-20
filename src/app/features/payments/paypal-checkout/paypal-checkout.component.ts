import { CommonModule, CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { paypalConfig } from '../../infrastructure/paypal.config';
import { ApplicationService } from '../../applications/application.service';
import { TripService } from '../../trips/trip.service';

type CheckoutStatus = 'idle' | 'ready' | 'success' | 'error';

type CaptureActions = {
  order: {
    capture: () => Promise<unknown>;
  };
};

type CreateActions = {
  order: {
    create: (order: {
      purchase_units: Array<{
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    }) => Promise<string>;
  };
};

type PayPalButtonsOptions = {
  createOrder: (_data: unknown, actions: CreateActions) => Promise<string>;
  onApprove: (_data: unknown, actions: CaptureActions) => Promise<void>;
  onError: (error: unknown) => void;
};

type PayPalButtonsInstance = {
  render: (container: HTMLDivElement) => Promise<void>;
};

type PayPalSdk = {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonsInstance;
};

type PayPalWindow = Window & {
  paypal?: PayPalSdk;
};

@Component({
  selector: 'app-paypal-checkout',
  imports: [CommonModule, CurrencyPipe, TranslatePipe],
  templateUrl: './paypal-checkout.component.html',
  styleUrl: './paypal-checkout.component.scss',
})
export class PaypalCheckoutComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly applicationService = inject(ApplicationService);
  private readonly tripService = inject(TripService);
  private readonly currency = 'EUR';

  @ViewChild('paypalButtons', { static: true })
  paypalButtonsRef!: ElementRef<HTMLDivElement>;

  readonly amount = signal(0);
  readonly status = signal<CheckoutStatus>('idle');
  readonly errorMessage = signal('');
  readonly applicationId = signal<string | null>(null);

  readonly hasValidAmount = computed(() => this.amount() > 0);

  ngAfterViewInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        const applicationId = this.route.snapshot.queryParamMap.get('applicationId');
        this.applicationId.set(applicationId);
        this.errorMessage.set('');
        this.status.set('idle');
        this.amount.set(0);
        this.paypalButtonsRef.nativeElement.innerHTML = '';

        if (!applicationId) {
          this.status.set('error');
          this.errorMessage.set('paypal.error.missing_application');
          return;
        }

        await Promise.all([this.applicationService.refresh(), this.tripService.refresh()]);

        const application = this.applicationService
          .applications()
          .find((item) => item.id === applicationId && item.status === 'DUE');

        if (!application) {
          this.status.set('error');
          this.errorMessage.set('paypal.error.not_available');
          return;
        }

        const trip = this.tripService.getById(application.tripId);
        this.amount.set(Math.max(0, trip?.totalPrice ?? 0));

        if (!this.hasValidAmount()) {
          this.status.set('error');
          this.errorMessage.set('paypal.error.invalid_amount');
          return;
        }

        try {
          await this.loadPaypalSdk();
          await this.renderButtons();
          this.status.set('ready');
        } catch (error) {
          console.error(error);
          this.status.set('error');
          this.errorMessage.set('paypal.error.sdk_load_failed');
        }
      });
  }

  private async loadPaypalSdk() {
    const paypalWindow = window as PayPalWindow;
    if (paypalWindow.paypal) {
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-sdk="true"]',
    );

    if (existingScript) {
      await new Promise<void>((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(), { once: true });
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src =
        `https://www.paypal.com/sdk/js?client-id=${paypalConfig.clientId}` +
        `&currency=${this.currency}&intent=capture&components=buttons`;
      script.async = true;
      script.dataset['paypalSdk'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('PayPal SDK failed to load.'));
      document.head.appendChild(script);
    });
  }

  private async renderButtons() {
    const paypal = (window as PayPalWindow).paypal;

    if (!paypal) {
      throw new Error('PayPal SDK not available.');
    }

    await paypal
      .Buttons({
        createOrder: (_data, actions) =>
          actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: this.currency,
                  value: this.amount().toFixed(2),
                },
              },
            ],
          }),
        onApprove: async (_data, actions) => {
          await actions.order.capture();
          const currentApplicationId = this.applicationId();
          if (!currentApplicationId) {
            this.status.set('error');
            this.errorMessage.set('paypal.error.missing_application');
            return;
          }

          const paid = await this.applicationService.payApplication(currentApplicationId);
          if (!paid) {
            this.status.set('error');
            this.errorMessage.set('paypal.error.update_failed');
            return;
          }
          this.status.set('success');
        },
        onError: (error) => {
          console.error(error);
          this.status.set('error');
          this.errorMessage.set('paypal.error.payment_error');
        },
      })
      .render(this.paypalButtonsRef.nativeElement);
  }

  goToApplications(): void {
    void this.router.navigate(['/applications']);
  }
}
