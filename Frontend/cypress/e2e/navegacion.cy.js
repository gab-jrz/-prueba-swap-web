 /* global describe, it, beforeEach, cy*/ 
/* eslint-env cypress */

//Evalué todo el flujo completo, de principio a fin

describe('Pruebas E2E, Navegación Básica', () => { //describe las pruebas de navegación básica de la app
  
  beforeEach(() => {
    cy.visit('/')
  })

  describe('1. Navegación Principal', () => { //verifica la navegación a la página principal
    it('debe cargar la página principal', () => { // verifica que la página principal se cargue correctamente
      cy.get('body').should('be.visible') //asegura que el cuerpo de la página sea visible
    })

    it('debe mostrar el título de la aplicación', () => { // verifica que el título de la aplicación sea visible
      cy.contains('SwapWeb').should('be.visible')
    }) // verifica que el título "SwapWeb" sea visible en la página principal
  })

  describe('2. Acceso a Login', () => { //verifica el acceso a la página de login
    it('debe navegar a la página de login', () => {
      cy.visit('/login') // navega a la página de login
      cy.url().should('include', '/login') // verifica que la URL incluya '/login'
    })

    it('debe mostrar formulario de login', () => { // verifica que el formulario de login se muestre correctamente
      cy.visit('/login')
      cy.get('input[type="email"]').should('be.visible') // verifica que el campo de email sea visible
      cy.get('input[type="password"]').should('be.visible') // verifica que el campo de contraseña sea visible
      cy.get('button').should('contain', 'Iniciar sesión') // verifica que el botón de iniciar sesión contenga el texto "Iniciar sesión"
    })
  })

  describe('3. Acceso a Registro', () => { //|
    it('debe navegar a la página de registro', () => {
      cy.visit('/register') // navega a la página de registro
      cy.url().should('include', '/register') // verifica que la URL incluya '/register'
    })

    it('debe mostrar formulario de registro', () => { // verifica que el formulario de registro se muestre correctamente
      cy.visit('/register') // navega a la página de registro
      cy.get('input[placeholder="Nombre"]').should('be.visible') // verifica que el campo de nombre sea visible
      cy.get('input[placeholder="Apellido"]').should('be.visible') // verifica que el campo de apellido sea visible
      cy.get('input[placeholder="Correo electrónico"]').should('be.visible') // verifica que el campo de correo electrónico sea visible
      cy.get('input[placeholder="Contraseña"]').should('be.visible') // verifica que el campo de contraseña sea visible
    })
  })

  describe('4. Restricciones sin Login', () => { //verifica las restricciones de acceso a ciertas páginas sin autenticación
    it('debe redirigir a login al acceder a perfil sin autenticación', () => { // verifica que al intentar acceder a un perfil sin autenticación, se redirija a la página de login
      cy.visit('/perfil/123') // intenta visitar un perfil específico
      cy.url().should('include', '/login') // verifica que la URL incluya '/login', indicando que se redirigió correctamente
    })

    it('debe redirigir a login al acceder a publicar producto sin autenticación', () => {
      cy.visit('/publicarproducto')
      cy.url().should('include', '/login') // verifica que al intentar acceder a la página de publicar producto sin autenticación, se redirija a la página de login
    })
  })

  describe('5. Navegación entre Páginas', () => { //verifica la navegación entre diferentes páginas de la aplicación
    it('debe poder volver a la página principal', () => {
      cy.visit('/login')
      cy.visit('/') // vuelve a la página principal
      cy.url().should('eq', Cypress.config().baseUrl + '/') // verifica que la URL sea la de la página principal
    })

    it('debe mantener la navegación funcional', () => { // verifica que la navegación entre las páginas de login, registro y principal funcione correctamente
      cy.visit('/login')
      cy.visit('/register')
      cy.visit('/')
      cy.get('body').should('be.visible') // asegura que el cuerpo de la página principal sea visible después de navegar entre páginas
    })
  })
}) 
