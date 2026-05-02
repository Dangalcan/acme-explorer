# AcmeExplorer

This project is part of the subject ***Frontend-technologies*** of Cloud, Data engineering and IT Management Master's. We decided to implement ***all*** requirements levels to achieve the **maximum mark**. We completed **C**, **B** and **A** level requirements and implemented **6 A+ tasks**.

All work is available [here](https://github.com/Dangalcan/acme-explorer/issues?q=is%3Aissue%20state%3Aclosed) and contributions information is available [here](https://github.com/Dangalcan/acme-explorer/graphs/contributors).

### Disclaimer

If you experiment problems testing payments requirement you can check that it works properly in this [video](https://youtu.be/wE66SEHcvgo). Paypal is very strict with public leaks and it is all the time checking if clientIds and other credentials are publicly available on Github. If this happens with our credentials, Paypal will revoke them and that feature will not work, which will lead to a penalization in project evaluation. Moreover, we experimented some problems because Paypal just release v6 javascript SDK so ended up adapting our implementation to it, which makes our code different from the one provided in the theory material. We apologise in advance in case it does not work during project evaluation. We hope this video serves as a prove that it used to work when we delivered the project.

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
acme-explorer2@personal.example.com
```

password:

```text
IM$s9#vk
```

## Development server

To start a local development server, run:

```bash
npm start
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

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
npm test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
npm run test:e2e
```

We made some e2e tests using Cypress. If you want to view the UI changes and interactions use the following command:

```bash
npm run start:cypress
```

A pop-up will appear. Go to e2e tests (should be marked as configured), select **CHROME** and run the tests in the UI. ***We do not guarantee Edge or Electron compatibility.***.

## Additional Resources

### Class Diagram

ACME-Explorer UML diagram can be found in *./docs/data_model* folder. You can find an image with all the UML diagram and a *draw.io* file in case the image provided does not show all the detail that you want when you zoom in.

### Implemented Project Requirements

Implemented project requirements report is accesible in ***Acme-Explorer-requirements.docx.md***.

### Done tasks

You can find all done tasks in *./docs* folder.

+ ***A+ tasks reports:*** Thery are stored in a dedicated folder for each derivable. *./docs/a_plus_tasks_d01/a_plus_tasks_d01.md* (1st delivery) *./docs/a_plus_tasks_d02/a_plus_tasks_d02.md* (2nd delivery) *./docs/a_plus_tasks_d03/a_plus_tasks_d03.md* (3rd delivery).

+ ***Derivable tasks:*** Individual derivable tasks report is stored in *./docs/individual_derivables_tasks/ACME-Explorer-Derivable-Requirements.md*.

+ ***Training tasks:*** Training tasks requirements report is stored in *./docs/training_tasks/ACME-Explorer_training_tasks.md*.
