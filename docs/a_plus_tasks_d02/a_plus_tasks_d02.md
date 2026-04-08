# A+ tasks selected and done for D02

### DO2

1. Integrate a third-party API providing weather information, so that when a forthcoming
trip is displayed, the application shows the weather forecast for the corresponding
location and date.

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