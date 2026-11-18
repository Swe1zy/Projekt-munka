describe('autentikálás', () => {
  it('regisztráció', () => {
    cy.visit('http://localhost:5173')
    cy.get('[data-teszt-profil="profil"]').click()
    cy.get('[data-teszt-reg="regisztracio"]').click()
    cy.get('[data-teszt-sutifogadas="rendben"]').click()
    cy.get('[data-teszt-aszf="elfogadva"]').check()
    cy.get('[data-teszt-regnev="nev"]').type('Kiss János')
    cy.get('[data-teszt-regemail="email"]').type('kiss.janos@gmail.com')
    cy.get('[data-teszt-regjelszo="jelszo"]').type('password123')
    cy.get('[data-teszt-regjelszomegerosites="jelszoMegerosites"]').type('password123')
    cy.get('[data-teszt-reggomb="regisztracio"]').click()
  })
})


describe('autentikálás', () => {
  it('Bejelentkezés', () => {
    cy.visit('http://localhost:5173')
    cy.get('[data-teszt-profil="profil"]').click()
    cy.get('[data-teszt-belepes="bejelentkezes"]').click()
    cy.get('[data-teszt-sutifogadas="rendben"]').click()
    cy.get('[data-teszt-loginemail="email"]').type('kiss.janos@gmail.com')
    cy.get('[data-teszt-loginjelszo="jelszo"]').type('password123')
    cy.get('[data-teszt-logingomb="belepes"]').click()
  })
})

// describe('autentikálás', () => {
//   it('Kijelentkezés', () => {
//     cy.visit('http://localhost:5173')
//     cy.get('[data-teszt-profil="profil"]').click()
//     cy.get('[data-teszt-kijelentkezes="kijelentkezes"]').click()
//   })
// })