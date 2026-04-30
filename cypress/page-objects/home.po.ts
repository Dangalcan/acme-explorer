export class HomePage {
  navigateTo() {
    return cy.visit('localhost:4200/');
  }
}