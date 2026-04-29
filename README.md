# AcmeExplorer

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

## User credentials

In order to login, at this current moment we offer the following user credentials (in the future there will be more):

### Admin

user:
```text
admin@acme-explorer.com
```

password:
```text
changeMe1@
```

### Explorer

user:
```text
explorer@acme-explorer.com
```

password:
```text
changeMe1@
```

### Manager

user:
```text
manager@acme-explorer.com
```

password:
```text
changeMe1@
```

## Payment credentials

email:

```text
acme-explorer@personal.example.com
```

password:

```text
IM$s9#vk
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Running with Docker

Just use the official image

```bash
docker pull megamagolas/acme-explorer:latest
```

Or you can just build the image locally by yourself

```bash
docker build -t acme-explorer .
```

Once you have your image, run it in a container

```bash
docker run --name acme-explorer -p 4200:4200 -p 3000:3000 acme-explorer
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
