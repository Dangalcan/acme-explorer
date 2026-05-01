export class TripsPage {

    navigateTo() {
        cy.visit('localhost:4200/trips');
    }

    getTripCards() {
        return cy.get('[data-cy="trip-card"]');
    }

    clickFirstTrip() {
        this.getTripCards().first().click();
    }

    getSearchInput() {
        return cy.get('[data-cy="trip-search-input"]');
    }

    typeSearchKeyword(keyword: string) {
        this.getSearchInput().clear().type(keyword);
    }

    getClearSearchButton() {
        return cy.get('[data-cy="trip-search-clear"]');
    }

    getEmptyState() {
        return cy.get('[data-cy="trip-empty-state"]');
    }

}
