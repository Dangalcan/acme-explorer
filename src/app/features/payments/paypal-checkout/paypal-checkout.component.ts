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

type PayPalApproveData = {
  orderID: string;
};

type PayPalButtonsOptions = {
  createOrder: () => Promise<string>;
  onApprove: (data: PayPalApproveData) => Promise<void>;
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
        `https://sandbox.paypal.com/sdk/js?client-id=${paypalConfig.clientId}` +
        `&currency=${this.currency}&intent=capture&components=buttons&debug=true`;
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
        createOrder: () => this.createPaypalOrder(),
        onApprove: (data) => this.capturePaypalOrder(data.orderID),
        onError: (error) => {
          console.error(error);
          this.status.set('error');
          this.errorMessage.set('paypal.error.payment_error');
        },
      })
      .render(this.paypalButtonsRef.nativeElement);
  }

  private async getAccessToken(): Promise<string> {
    const credentials = btoa(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`);
    const response = await fetch(`${paypalConfig.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) throw new Error('Failed to get PayPal access token');
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }

  private async createPaypalOrder(): Promise<string> {
    const token = await this.getAccessToken();
    const response = await fetch(`${paypalConfig.apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: this.currency,
              value: this.amount().toFixed(2),
            },
          },
        ],
      }),
    });
    if (!response.ok) throw new Error('Failed to create PayPal order');
    const order = (await response.json()) as { id: string };
    return order.id;
  }

  private async capturePaypalOrder(orderID: string): Promise<void> {
    const token = await this.getAccessToken();
    const response = await fetch(
      `${paypalConfig.apiBase}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!response.ok) {
      const err = (await response.json()) as { message?: string };
      throw new Error(err.message ?? 'Failed to capture PayPal order');
    }

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
  }

  goToApplications(): void {
    void this.router.navigate(['/applications']);
  }
}
