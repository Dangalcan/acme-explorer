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

5. ~~Implement lazy loading to improve application performance by loading modules only
when they are required.~~ DONE: All route components were converted from eager static imports to lazy-loaded standalone components using Angular's `loadComponent` API. Before this change, `app.routes.ts` imported every component at the top of the file (e.g. `import { DashboardComponent } from './features/admin/dashboard/dashboard.component'`), which caused the entire application to be bundled into a single chunk downloaded on the first page load. After the change, every route entry uses a dynamic import instead:

   ```ts
   {
     path: 'admin/dashboard',
     loadComponent: () =>
       import('./features/admin/dashboard/dashboard.component')
         .then(m => m.DashboardComponent),
   }
   ```

   Angular's build pipeline now emits a separate JavaScript chunk per component (e.g. `dashboard-component-HASH.js`, `trip-list-component-HASH.js`). Each chunk is only fetched from the server the first time the user navigates to the corresponding route. The three route guards (`adminGuard`, `explorerGuard`, `authGuard`) were kept as synchronous imports because they are tiny functions that must resolve before a component is even requested, so deferring them would add latency without reducing the initial bundle. The full list of lazy-loaded routes covers: `TripListComponent`, `TripDisplayComponent`, `ApplicationsComponent`, `FinderComponent`, `FavouritesPageComponent`, `SettingsComponent`, `DashboardComponent`, `CreateManagerComponent`, `UsersListComponent`, `LoginComponent`, `RegisterComponent`, `ForbiddenComponent`, and `NotFoundComponent`.

6. Use a library to support dynamic language switching at runtime.