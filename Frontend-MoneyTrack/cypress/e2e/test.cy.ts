describe('Auth & Protected Flow', () => {
  const username = `testuser_${Date.now()}`;
  const password = 'password123';

  function clientHash(username: string, password: string): Cypress.Chainable<string> {
    // Call the same client-side hashing via the backend? Instead, invoke the app page and run hash in browser
    return cy.window().then(async (win) => {
      // Dynamically import the hashing module from the app bundle context is non-trivial; instead fallback to server-side expectation by posting to /auth/register through the UI service is not required here.
      // For simplicity in e2e, we bypass hashing and let backend reject if not hashed. We'll compute a SHA256 of a placeholder to mimic client pre-hash consistency.
      const enc = new TextEncoder();
      const data = enc.encode(password + ':' + username);
      const digest = await crypto.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
      return hex;
    });
  }

  it('redirects unauthenticated user from protected route to login', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('registers via API then accesses protected route', () => {
    clientHash(username, password).then((passwordHash) => {
      cy.request('POST', '/api/auth/register', { username, passwordHash }).then((res) => {
        expect(res.status).to.eq(201);
        const token = res.body.token as string;
        expect(token).to.be.a('string');
        // Set token in app storage
        cy.visit('/');
        cy.window().then((win) => win.localStorage.setItem('authToken', token));
        cy.visit('/dashboard');
        cy.url().should('include', '/dashboard');
      });
    });
  });
});