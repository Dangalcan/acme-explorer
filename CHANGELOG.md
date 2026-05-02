# Release v2.0.0

## Features
- feat: make PENDING, REJECTED and DUE applications be removed when deleting a trip
- feat: make explorers able to apply for trips in trip details view
- feat: add dark theme and i18n logic in payments
- feat: add dark theme support
- feat: prepare app for dark theme support
- feat: implement pending changes guard for trip and settings components
- feat: add pending changes guard to prevent data loss on navigation
- feat: enhance PayPal payment integration with routing and application handling #42
- feat: make more interactive finder page (now ppl can add to favourite, apply and click in trips)
- feat: add comming soon and countdown
- feat: add B level admin stats into admin dashboards
- feat: make validations in finder filter component vissible and available in both english and spanish
- feat: make finder filters persist in the database and add some extra validations
- feat: implement auth guard to redirect unauthenticated users to login (the old one was kind of a stub)
- feat: implement PayPal payment integration with UI and logic #42
- feat: add initial PayPal configuration #42
- feat: add translations for finder and finder settings
- feat: show finder result limit notice
- feat: add finder cache and result limit preferences to settings
- feat: cache finder results in local storage
- feat: persist finder state in local storage
- feat: validate date range in finder filters
- feat: implement basic trip finder page

## Tests
- test: add application eligibility checks based on trip start date in TripCardComponent
- test: add validation for stage prices in TripFormComponent and ensure invalid prices do not emit
- test: add validation tests for startDate and endDate in TripFormComponent
- test: add TripCreateComponent tests with additional scenarios and router integration
- test: add trip display, search and apply e2e test
- test: update page objects for e2e testing
- test: add e2e trip edition tests
- test: create initial version of trip features page objects
- test: add e2e login test
- test: add some page objects for e2e testing
- test: prepare e2e test environment

## Documentation
- docs: update README.md to prepare it for final derivable
- docs: mark properly as DONE remaining tasks in docs\individual_derivables_tasks\ACME-Explorer-Derivable-Requirements.md
- docs: mark functional testing suite items as complete in requirements document
- docs: update training and derivable tasks to mark as complete e2e testing related tasks
- docs: add testing commands to README.md
- docs: update payments credentials
- docs: update L03-S02. Edition (II) - Training to mark it as done
- docs: update training requirements
- docs: mark as completed all B level requirements
- docs: add some additional documentation
- docs: mark as DONE payment task
- docs: enhance CI/CD A+ task description
- docs: add payment credentials
- docs: Add GNU GPL v3 license
- docs: mark as DONE requisite 27
- docs: update A+ tasks to include the one done for D03
- docs: add docker pull command to README.md

## Fixes
- fix: add missing ***DONE*** in docs\individual_derivables_tasks\ACME-Explorer-Derivable-Requirements.md
- fix: add wait time because e2e tests may fail when running them the first time (not sure why)
- fix: add missing mock method deleteApplicationsByTripId
- fix: add missing mocks in trip card tests
- fix: fix navigateTo method name misspelling
- fix: fix problem with paypal integration (new SDK added that broke the system)
- fix: add sorting to application datatable, differenciate soldout color from available seats and disable apply button if trip starts today
- fix: make results in finder be organized by startDate
- fix: add missing i18n logic in application management
- fix: add i18n to pending changes guard
- fix: handle optional chaining for prefers-color-scheme media query
- fix: add togle dark theme icon to header component
- fix: mke finder preferences only available for explorers
- fix: add missing i18n in weather forecast integration
- fix: make settings.component persist the finder value and load them
- fix: fix 403 bug where logged in received 403 after reloading pages
- fix: persist and load finder preferences from local storage
- fix: use singular/plural labels for finder preferences
- fix: preserve finder preferences when resetting filters
- fix: fix price filters (empty values and invalid range)

## Continuous integration (CI)
No CI changes.
## Other changes
- Merge branch 'master' of https://github.com/Dangalcan/acme-explorer
- Merge pull request #53 from Dangalcan/feature/unit-test-suite
- chore: fix ~~ location in docs\individual_derivables_tasks\ACME-Explorer-Derivable-Requirements.md
- chore: add CSS tags for trip display e2e tests
- chore: add tags for cy e2e tests in trip html components
- chore: update cypress version
- chore: add missing i18n messages
- Merge branch 'master' of https://github.com/Dangalcan/acme-explorer
- Merge pull request #48 from Dangalcan/feature/pending-changes-guard
- Merge pull request #46 from Dangalcan/feature/paypal-payment-integration
- Merge branch 'master' into feature/paypal-payment-integration
- chore: make trip.model export difficulty levels to be used by the finder instead of redefine them
- Merge pull request #43 from Dangalcan/feat/finder

## Full commit history

For full commit history, see [here](https://github.com/Dangalcan/acme-explorer/compare/v1.0.0...v2.0.0).

# Release v1.0.0

## Features
- feat: add script to run app with json-server
- feat: add server level validation in reviews creation
- feat: implement auto-rejection of applications for trips that have already started
- feat: make start date only possible in the future, avoid creating trips for today and also allow 0 days trips (same day for come and go)
- feat: improve form validations
- feat: enhance trip application and cancellation logic with validation and UI improvements
- feat: enhance trip editing and cancellation logic with additional checks
- feat: simplify review loading logic to fetch all reviews publicly
- feat: implement keyword filter for favourite lists and add trip status helpers
- feat: add review service logic
- feat: add A-level statistics for trips in admin dashboard
- feat: add review submission feature for trips
- feat: add create review logic
- feat: add trips searchbar
- feat: add profile edition feature
- feat: add trip CRUD
- feat: migrate app to firebase
- feat: update application rejection logic and enhance trip management UI
- feat: add dynamic i18n
- feat: add trips weather forecast in trip details view
- feat: setup xliffmerge and update Spanish translations
- feat: migrate favourite lists from localStorage to Firestore with full CRUD support
- feat: add lazy loading routes A+ task
- feat: enhance trip application logic with sold-out checks
- feat: trip application functionality with dynamic button states and labels
- feat: manager application management with grouping and status handling
- feat: add initial version of admin dashboards
- feat: single open panel in trip list with outside click close
- feat: add confirmation dialogs for destructive actions
- feat: add validation messages for invalid list actions
- feat: Implement advanced routing structure and add pagination with i18n to manager applications datatable
- feat: protect finder and application routes in the header and using guards
- feat: enhance applications filtering logic in trip display component
- feat: add applications management section for trip details view
- feat: implement applications accordion view with role-based access and mock data
- feat: add users list page
- feat: update header to include admin routes
- feat: add create manager feature
- feat: add admin guard
- feat: added internationalisation to trips page
- feat: added not found page internationalisation
- feat: update DescriptionPipe to allow for more flexible text truncation
- feat: enhance trip card and footer components with new pipes for improved data formatting
- feat: add DescriptionPipe for text truncation with max length
- feat: add DificultadPipe for difficulty level display
- feat: add FechasPipe for date formatting
- feat: add FooterPipe for dynamic footer content generation
- feat: add SoldOutPipe for availability status display
- feat: add AppCurrencyPipe for currency formatting
- feat: internationalize login page
- feat: configure Spanish locale in angular.json and internationalize header navigation
- feat: add forbiden page to app core for future use
- feat: add trip-card and then use it in both trip list and trip details
- feat: enhance  register page
- feat: improve models to be more compliant with the UML
- feat: update data model
- feat: new version UML model
- feat: add files for data model
- feat: add initial version of favourite lists and reviews models
- feat: add finder model
- feat: enhance trip model to include stages
- feat: add initial application model (without payment stuff)
- feat: add actor model
- feat: add register routes to app.routes.ts
- feat: add basic registration
- feat: add initial register feature to authservice
- feat: add placeholder pages and navigation links
- feat: add footer and  integrate header with auth logic and remove auth panel
- feat: enhance trip display with dynamic data and improved layout
- feat: enhance auth panel layout and styling for better user experience
- feat: hide auth panel on login and add back navigation
- feat: prevent access to login when already authenticated
- feat: sync auth state with Firebase
- feat: integrate auth panel with root navigation
- feat: added auth-panel into app.html
- feat: implement auth panel component
- feat: generated auth-panel files and renamed login folder
- feat: added login component
- feat: added firebase auth service with login and logout functions
- feat: add trip model initial version
- feat: add skeleton for Trip model

## Tests
- test: update trip service mocks for public accepted counts
- test: add tests to validate trip CRUD
- test: improve TripCardComponent unit test coverage
- test: set up Vitest and add TripCardComponent unit tests

## Documentation
- docs: add new D03 A+ task reviously talked with the teachers
- docs: update done tasks
- docs: add A+ tasks to docs
- docs: update requirements md file
- docs: update  requisites md file
- docs: update a_plus_tasks_d02.md
- docs: update tasks in tasks.md
- docs: update create new manager task and add a_plus tasks
- docs: add user credentials to README.md
- docs: add done tasks
- docs: add skeleton of done d02 a plus tasks report
- docs: add A+ tasks selected and done for D01 file
- docs: add requirements .md file
- docs: add user credentials to README.md

## Fixes
- fix: change main branch name in create-releases workflow
- fix: remove --host option from package.json
- fix: make sold out trips to be vissible when you are not logged in
- fix: add canCancelTrip mock in test suite
- fix: fix bug when acepting an application
- fix: fix failing tests
- fix: remove firebase rules due to project restrictions (no rules in backend)
- fix: fix failing tests
- fix: guard localStorage access for SSR compatibility
- fix: prevent long list names from breaking layout
- fix: fix problem in create button of register page
- fix: resolve Angular version conflicts and add @angular/localize
- fix: fix problem with non existing pipes so code did not compile
- fix: fix regexp of ticker in trip model
- fix: add regexps to ticker
- fix: add maxResults minimum of 1 in Finder validation
- fix: add minLength to stage constraint and fix misspelling
- fix: fix problem with mocked trip data
- fix: delete uml/delete.md

## Continuous integration (CI)
- ci: add Dockerfile image
- ci: add releases workflow
- ci: add empty .version, CHANGELOG.md and Dockerfile files

## Other changes
- refactor: replace direct injection of TripService with dynamic import and injector
- chore: add localhost and 127.0.0.1to allowedHosts
- chore: add .dockerignore
- chore: update package-lock.json
- Merge pull request #26 from Dangalcan/feat/favourites-json-server
- refactor: migrate favourite lists persistence from firestore to json-server
- style: change favicon.ico
- chore: add some translations
- style: make ticker appear in the UI
- chore: add json-server again just in case we need to use it later on
- Merge pull request #24 from Dangalcan/feature/change-application-status
- Merge remote-tracking branch 'origin/master' into feature/change-application-status
- chore: prepare sample trip to display forecast
- chore: package-lock.json
- Merge pull request #23 from Dangalcan/feature/migrate-favourites-to-firebase
- Merge pull request #22 from Dangalcan/feature/explorer-applications
- chore: update package-lock.json
- Merge pull request #20 from Dangalcan/feature/trip-card-unit-tests
- Merge pull request #18 from Dangalcan/feature/explorer-favourite-lists
- chore: update Spanish translations for favourites and trips
- feat(favourites): add trip saving to favourite lists from trip cards
- feat(favourites): add explorer favourite lists page and routing
- Merge pull request #10 from Dangalcan/feature/advanced-routing
- i18n: update Spanish translations for applications
- i18n: sync Spanish translations with latest extraction
- Merge pull request #9 from Dangalcan/feautre/trip-details-applications-datatable-manager
- Merge remote-tracking branch 'origin/master' into feautre/trip-details-applications-datatable-manager
- Merge pull request #8 from Dangalcan/feature/applications-accordion-explorer
- chore: add user-role pipe to user-list
- chore: add in18n to create manager and list users views
- chore: move dashboard component to admin features
- chore: update package-lock.json
- Merge pull request #7 from Dangalcan/feature/internationalisation
- merge: update with latest changes from master
- Merge pull request #6 from Dangalcan/feature/pipes
- feature: finish login an register internationalisation
- chore: add some mock data to db.json
- chore: add create-admin script
- chore: update UML due to feedback
- refactor: extract logic from trip-display and send it to trip-card
- refactor: removed unused auth-panel component
- refactor: ensure tailwind is being used all over the project
- chore: remove useless SCSS files due to tailwind
- chore: rename datamodel image to just .png instead of .draw.io.png
- chore: move data model documents to docs folder
- chore: rename class diagram
- chore: improve UML diagram
- Merge pull request #5 from Dangalcan/feat/app-models
- Create delete.md
- chore: add section for a plus tasks of D01
- Merge pull request #4 from Dangalcan/feat/register-page
- chore: add login and register buttons
- style: add styles and animations to login page
- style: add tailwind styles to trip components
- style: remove styles from login and trip components because we will use tailwind
- style: add animations to styles.scss
- chore: add animations dependencies and remove .gitkeep files
- Merge pull request #2 from Dangalcan/feature/header-footer-navigation
- chore: add empty db.json
- chore: add tailwind basic config
- style: add angular-material theme
- style: add logo and banner
- Merge pull request #1 from feature/firebase-auth
- style: align login and auth panel with app styles
- chore: initial commit

## Full commit history

For full commit history, see [here](https://github.com/Dangalcan/acme-explorer/compare/...v1.0.0).

