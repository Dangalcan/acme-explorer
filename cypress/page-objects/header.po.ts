export class HeaderPage {

    getLoginLink() {
        return cy.get('[data-cy="login-btn"]');
    }

    getLogoutButton() {
        return cy.get('[data-cy="logout-btn"]');
    }

    verifyLoggedIn() {
    this.getLogoutButton().should('be.visible');
    this.getLoginLink().should('not.exist');
    }

    vertifyLoggedOut() {
        this.getLoginLink().should('be.visible');
        this.getLogoutButton().should('not.exist');
    }


}