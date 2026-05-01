import { LoginPage } from '../page-objects/login.po';
import { HeaderPage } from '../page-objects/header.po';
import { TripsPage } from '../page-objects/trips.po';
import { TripDisplayPage } from '../page-objects/trip_display.po';
import { TripCreatePage } from '../page-objects/trip-create.po';

describe('Trip browsing, searching and applying', () => {
    const loginPage = new LoginPage();
    const headerPage = new HeaderPage();
    const tripsPage = new TripsPage();
    const tripDisplayPage = new TripDisplayPage();
    const tripCreatePage = new TripCreatePage();

    let tripId: string;

    const UNIQUE_KEYWORD = 'CypressE2EBrowseApply';

    const clearStorage = () => {
        cy.clearAllCookies();
        cy.clearAllLocalStorage();
        cy.clearAllSessionStorage();
        cy.window().then((win) => {
            return win.indexedDB.databases().then((dbs) => {
                dbs.forEach((db) => win.indexedDB.deleteDatabase(db.name!));
            });
        });
    };

    const loginAsManager = () => {
        loginPage.navigateTo();
        loginPage.fillInLoginFormAsManager();
        headerPage.getLogoutButton().should('be.visible');
    };

    const loginAsExplorer = () => {
        loginPage.navigateTo();
        loginPage.fillInLoginFormAsExplorer();
        headerPage.getLogoutButton().should('be.visible');
    };

    before(() => {
        clearStorage();
        loginAsManager();
        tripCreatePage.navigateTo();
        tripCreatePage.fillRequiredFieldsAndSubmit({
            title: `${UNIQUE_KEYWORD} Trip`,
            description: `${UNIQUE_KEYWORD} description for e2e browse and apply test`,
            startDate: '2028-06-01',
            endDate: '2028-07-01',
            stageTitle: 'Stage One',
            stageDescription: 'Stage One description',
            stagePrice: '100',
        });
        cy.url()
            .should('not.include', '/trips/create')
            .should('match', /\/trips\/[^/]+$/)
            .then((url) => {
                tripId = url.split('/trips/')[1];
            });
    });

    after(() => {
        clearStorage();
        loginAsManager();
        cy.then(() => cy.visit(`localhost:4200/trips/${tripId}`));
        tripDisplayPage.getDeleteButton().click();
        cy.url().should('match', /\/trips$/);
    });

    beforeEach(() => {
        cy.intercept('GET', '**/google.firestore.v1.Firestore/Listen/**').as('firestoreListen');
        clearStorage();
    });

    it('should display trip list with cards', () => {
        tripsPage.navigateTo();
        tripsPage.getTripCards().should('have.length.greaterThan', 0);
    });

    it('should search trips by keyword and show matching result', () => {
        tripsPage.navigateTo();
        tripsPage.getTripCards().should('have.length.greaterThan', 0);
        tripsPage.typeSearchKeyword(UNIQUE_KEYWORD);
        tripsPage.getTripCards().should('have.length.at.least', 1);
        tripsPage.getTripCards().first().should('contain.text', UNIQUE_KEYWORD);
    });

    it('should show empty state when no trips match the keyword', () => {
        tripsPage.navigateTo();
        tripsPage.getTripCards().should('have.length.greaterThan', 0);
        tripsPage.typeSearchKeyword('xyzzy_no_match_12345');
        tripsPage.getEmptyState().should('be.visible');
        tripsPage.getTripCards().should('have.length', 0);
    });

    it('should clear search and restore the full trip list', () => {
        tripsPage.navigateTo();
        tripsPage.getTripCards().should('have.length.greaterThan', 1);
        tripsPage.typeSearchKeyword(UNIQUE_KEYWORD);
        tripsPage.getTripCards().should('have.length.at.least', 1);
        tripsPage.getClearSearchButton().click();
        tripsPage.getSearchInput().should('have.value', '');
        tripsPage.getTripCards().should('have.length.greaterThan', 1);
    });

    it('should display trip details when clicking on a search result', () => {
        tripsPage.navigateTo();
        tripsPage.getTripCards().should('have.length.greaterThan', 0);
        tripsPage.typeSearchKeyword(UNIQUE_KEYWORD);
        tripsPage.getTripCards().should('have.length.at.least', 1);
        tripsPage.getTripCards().first().click();
        cy.url().should('match', /\/trips\/[^/]+$/);
        cy.url().should('not.include', '/trips/create');
        tripDisplayPage.getTripTitle().should('contain.text', UNIQUE_KEYWORD, { timeout: 10000 });
    });

    it('should apply for a trip as an explorer from the trip detail page', () => {
        loginAsExplorer();
        cy.then(() => cy.visit(`localhost:4200/trips/${tripId}`));
        tripDisplayPage.getTripTitle().should('contain.text', UNIQUE_KEYWORD, { timeout: 10000 });
        tripDisplayPage.getApplyButton().should('be.visible').and('not.be.disabled').click();
        tripDisplayPage.getApplyCommentTextarea()
            .should('be.visible')
            .type('I am very interested in this trip!');
        tripDisplayPage.getApplyConfirmButton().should('not.be.disabled').click();
        tripDisplayPage.getApplyButton().should('contain.text', 'Applied', { timeout: 10000 });
    });
});
