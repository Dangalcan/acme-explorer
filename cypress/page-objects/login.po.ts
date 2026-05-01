export class LoginPage {

    private adminCredentials = {
        username: 'admin@acme-explorer.com',
        password: 'changeMe1@'
    }

    private managerCredentials = {
        username: 'manager@acme-explorer.com',
        password: 'changeMe1@'
    }

    private explorerCredentials = {
        username: 'explorer@acme-explorer.com',
        password: 'changeMe1@'
    }

    private badCredentials = {
        username: 'badCredentials',
        password: 'badCredentials'
    }

    navigateTo() {
        return cy.visit('localhost:4200/login');
    }


    fillInLoginFormAsAdmin() {
        cy.get('[data-cy="email-input"]').type(this.adminCredentials.username);
        cy.get('[data-cy="password-input"]').type(this.adminCredentials.password);
        cy.get('[data-cy="login-submit"]').click();
    }

    fillInLoginFormAsManager() {
        cy.get('[data-cy="email-input"]').type(this.managerCredentials.username);
        cy.get('[data-cy="password-input"]').type(this.managerCredentials.password);
        cy.get('[data-cy="login-submit"]').click();
    }

    fillInLoginFormAsExplorer() {
        cy.get('[data-cy="email-input"]').type(this.explorerCredentials.username);
        cy.get('[data-cy="password-input"]').type(this.explorerCredentials.password);
        cy.get('[data-cy="login-submit"]').click();
    }

    fillInLoginFormWithBadCredentials() {
        cy.get('[data-cy="email-input"]').type(this.badCredentials.username);
        cy.get('[data-cy="password-input"]').type(this.badCredentials.password);
        cy.get('[data-cy="login-submit"]').click();
    }


}