# A+ tasks selected and done for D02

### DO2

1. ~~Integrate a third-party API providing weather information, so that when a forthcoming
trip is displayed, the application shows the weather forecast for the corresponding
location and date.~~ DONE: Integrated the **Open-Meteo** API (free, no API key required) to display a weather forecast widget on the trip detail page for forthcoming trips.

   **How it works:**

   - `provideHttpClient(withFetch())` was added to `app.config.ts` — the app had no `HttpClient` registered before.
   - A new `WeatherService` (`src/app/shared/weather/weather.service.ts`) handles two sequential API calls:
     1. **Geocoding** — `https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1` converts the trip's `city` field into latitude/longitude coordinates.
     2. **Forecast** — `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=...&end_date=...` retrieves daily forecasts from today up to the trip's start date (capped at 16 days, which is Open-Meteo's maximum forecast window). Both calls use `firstValueFrom()` (RxJS) to await a single HTTP response inside an `async` method, keeping the public API as Angular signals (`loading`, `error`, `forecast`).
   - WMO weather codes returned by the API are mapped to human-readable labels and emoji icons via a `weatherLabel(code)` helper function (e.g. code `0` → ☀️ Clear sky, codes `51–67` → 🌧️ Rain, codes `95+` → ⛈️ Thunderstorm).
   - A standalone `WeatherWidgetComponent` (`src/app/shared/weather/weather-widget.component.ts`) takes `location: TripLocation` and `startDate: Date` as inputs. On `ngOnInit` it calls the service if the trip is within the 16-day window. The template renders a responsive grid of day cards (emoji, °max/°min, condition label), a spinner while loading, an error message on failure, and a friendly "Forecast not yet available" notice for trips further than 16 days away.
   - The widget is inserted in `trip-card.component.html` inside the `details` mode block, between the Photos section and the Reviews section, guarded by `@if (trip.location && trip.startDate > today)` so it only appears for forthcoming trips that have a location set.

2. Integrate a third-party API for currency conversion to adapt trip prices according to the
user’s locale.

3. Use the browser’s Geolocation API to obtain the user’s current location and display
nearby trips.

4. Practice debugging and troubleshooting: learn how to identify and resolve issues in an
Angular application using developer tools, Angular CLI commands (e.g., ng serve, ng
build, ng test), and other diagnostic tools.

5. ~~Implement lazy loading to improve application performance by loading modules only when they are required.~~ DONE: All route components were converted from eager static imports to lazy-loaded standalone components using Angular's `loadComponent` API. Before this change, `app.routes.ts` imported every component at the top of the file (e.g. `import { DashboardComponent } from './features/admin/dashboard/dashboard.component'`), which caused the entire application to be bundled into a single chunk downloaded on the first page load. After the change, every route entry uses a dynamic import instead:

   ```ts
   {
     path: 'admin/dashboard',
     loadComponent: () =>
       import('./features/admin/dashboard/dashboard.component')
         .then(m => m.DashboardComponent),
   }
   ```

   Angular's build pipeline now emits a separate JavaScript chunk per component (e.g. `dashboard-component-HASH.js`, `trip-list-component-HASH.js`). Each chunk is only fetched from the server the first time the user navigates to the corresponding route. The three route guards (`adminGuard`, `explorerGuard`, `authGuard`) were kept as synchronous imports because they are tiny functions that must resolve before a component is even requested, so deferring them would add latency without reducing the initial bundle. The full list of lazy-loaded routes covers: `TripListComponent`, `TripDisplayComponent`, `ApplicationsComponent`, `FinderComponent`, `FavouritesPageComponent`, `SettingsComponent`, `DashboardComponent`, `CreateManagerComponent`, `UsersListComponent`, `LoginComponent`, `RegisterComponent`, `ForbiddenComponent`, and `NotFoundComponent`.

6. ~~Use a library to support dynamic language switching at runtime.~~ DONE: Replaced the static Angular build-time i18n system (`@angular/localize` / XLIFF) with **`@ngx-translate/core` v17** (`@ngx-translate/http-loader` v17), which loads translation JSON files at runtime and allows the user to switch language without a page reload or a separate build per locale.

   **How it works:**

   - **Translation files** — Two JSON files (`public/i18n/en.json` and `public/i18n/es.json`) hold all user-facing strings organised by feature namespace (e.g. `header.trips`, `auth.login`, `trips.max_participants`). Keys that require interpolation use the `{{ param }}` syntax supported by ngx-translate (e.g. `"max_participants": "Max {{count}} participants"`).
   - **Provider setup** (`src/app/app.config.ts`) — `provideTranslateService({ fallbackLang: 'en' })` registers the core service, and `...provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' })` (spread into the root `providers` array) registers the HTTP-based loader that fetches the active language's JSON file from the server on demand.
   - **SSR-safe loader** (`src/app/app.config.server.ts`) — The HTTP loader makes network requests which would fail during server-side rendering. A custom `ServerTranslateLoader` class (implementing `TranslateLoader`) imports both JSON files statically via ES `import` and returns them synchronously through `of()`. It is registered via `{ provide: TranslateLoader, useClass: ServerTranslateLoader }` inside the server-side `mergeApplicationConfig` block, overriding the HTTP loader for the Node.js render pass only.
   - **`LanguageService`** (`src/app/core/services/language.service.ts`) — A root-level service that wraps `TranslateService`. Its `init()` method registers the supported languages (`en`, `es`), reads any previously saved preference from `localStorage` (guarded by `isPlatformBrowser` to avoid SSR crashes), and calls `translate.use(lang)` to activate the language. Its `switchLanguage()` method toggles between `en` and `es`, calls `translate.use()`, and persists the choice to `localStorage`. `App` calls `languageService.init()` in `ngOnInit`.
   - **Language toggle button** — The header (`src/app/shared/layout/header/header.component.html`) gained an EN/ES toggle button: `<button mat-button (click)="languageService.switchLanguage()">{{ 'language.switch' | translate }}</button>`. It is always visible and shows the opposite language label (e.g. "ES" when English is active).
   - **Template migration** — Every HTML template that previously used Angular's `i18n` attribute syntax was updated:
     - `<span i18n>Text</span>` → `<span>{{ 'key' | translate }}</span>`
     - `i18n-placeholder="..."` → `[placeholder]="'key' | translate"`
     - `i18n-aria-label="..."` → `[attr.aria-label]="'key' | translate"`
     - Angular ICU plural expressions (`{count, plural, =1 {...} other {...}}`) — not supported by ngx-translate — were replaced with `@if` / `@else` blocks using two separate translation keys (e.g. `user_total_one` and `user_total`).
   - **TypeScript migration** — Every `$localize` tagged-template call in component and service TypeScript files was replaced with `this.translate.instant('key', { params })` (synchronous, using the currently active language). Static class-property arrays that were initialised once with `$localize` strings (e.g. `monthNames`, status labels) were converted to arrays of translation *keys*, and the translation is applied at render time via `| translate` in the template.
   - **Reactive pipes** — `UserRolePipe` and the new `FechasPipe` are both `pure: false`, which forces Angular to re-evaluate them on every change-detection cycle. This ensures that their output updates immediately after a language switch without needing explicit `TranslateService` subscriptions.
   - **Language-aware date pipe** (`src/app/shared/pipes/fechas.pipe.ts`) — `FechasPipe` reads `TranslateService.currentLang` on every evaluation and maps it to an Angular locale string via a `LANG_TO_LOCALE` map (`en` → `'en-US'`, `es` → `'es-ES'`). It passes that locale to `formatDate()`, so month names and other locale-specific tokens automatically switch between English and Spanish when the user changes the language. Spanish locale data is registered once at startup via `registerLocaleData(localeEs)` in `app.config.ts`.
   - **`angular.json` cleanup** — `"polyfills": ["@angular/localize/init"]` was removed (replaced with an empty array) since `@angular/localize` is no longer used at runtime.
