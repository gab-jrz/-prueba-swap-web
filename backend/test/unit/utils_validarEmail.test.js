import { expect } from '../helpers/testHelper.js';
import validarEmail from '../../src/utils/validarEmail.js';

// Pruebas AAA para validarEmail

describe('Utils validarEmail', function () {
  it('debería validar emails correctos', async () => {
    // Arrange
    const casos = [
      'user@example.com',
      'nombre.apellido@dominio.co',
      'user+tag@sub.domain.org',
      'u@a.io'
    ];

    // Act
    const resultados = casos.map(validarEmail);

    // Assert
    resultados.forEach((r) => expect(r).to.equal(true));
  });

  it('debería rechazar emails inválidos', async () => {
    // Arrange
    const casos = [
      '',
      'plainaddress',
      '@missinglocal.com',
      'user@',
      'user@domain',
      'user@domain,com',
      'user@ domain.com', // espacio invalido
      'user@@domain.com'  // doble @ invalido
    ];

    // Act
    const resultados = casos.map(validarEmail);

    // Assert
    resultados.forEach((r) => expect(r).to.equal(false));
  });
});
