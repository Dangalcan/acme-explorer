import {LoginPage} from '../page-objects/login.po';
import { HomePage } from '../page-objects/home.po';
import { HeaderPage } from '../page-objects/header.po';

describe('Login test', () => {
  const loginPage = new LoginPage();
  const headerPage = new HeaderPage();
  const homePage = new HomePage();

  beforeEach(() => {
      cy.clearAllCookies();
      cy.clearAllLocalStorage();
      cy.clearAllSessionStorage();
      cy.window().then((win) => {
          const promise = win.indexedDB.databases().then((dbs) => {
              dbs.forEach((db) => win.indexedDB.deleteDatabase(db.name!));
          });
          return promise;
      });
  });

  it('should login as admin successfully', () => {
    homePage.navigateTo();
    headerPage.getLoginLink().click();
    loginPage.fillInLoginFormAsAdmin();
    headerPage.getLogoutButton().should('be.visible');
    headerPage.getLogoutButton().click();
    headerPage.getLoginLink().should('be.visible');
  })

  it('should login as manager successfully', () => {
    homePage.navigateTo();
    headerPage.getLoginLink().click();
    loginPage.fillInLoginFormAsManager();
    headerPage.getLogoutButton().should('be.visible');
    headerPage.getLogoutButton().click();
    headerPage.getLoginLink().should('be.visible');
  })

  it('should login as explorer successfully', () => {
    homePage.navigateTo();
    headerPage.getLoginLink().click();
    loginPage.fillInLoginFormAsExplorer();
    headerPage.getLogoutButton().should('be.visible');
    headerPage.getLogoutButton().click();
    headerPage.getLoginLink().should('be.visible');
  })

  it('should not login with bad credentials', () => {
    homePage.navigateTo();
    headerPage.getLoginLink().click();
    loginPage.fillInLoginFormWithBadCredentials();
    cy.url().should('include', '/login');
    cy.get('p.animate-fade-in').should('be.visible'); 
    headerPage.getLoginLink().should('not.exist');
  })


})