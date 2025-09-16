import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import Product from '../../src/models/Product.js';

describe('Pruebas Product', function () {
  it('debería crear un producto válido cuando se proveen todos los campos requeridos', async () => {
    // Arrange
    const doc = {
      title: 'Bicicleta',
      description: 'Bici en buen estado',
      categoria: 'Deportes',
      images: ['/uploads/products/a.jpg'],
      ownerId: 'user-1',
      caracteristicas: ['roja', 'rodado 29']
    };

    // Act
    const product = new Product(doc);
    const saved = await product.save();

    // Assert
    expect(saved).to.have.property('id').that.is.a('number');
    expect(saved.title).to.equal(doc.title);
    expect(saved.images).to.deep.equal(doc.images);
    expect(saved.intercambiado).to.equal(false);
    expect(saved).to.have.property('createdAt');
    expect(saved).to.have.property('updatedAt');
  });

  it('debería autoincrementar id comenzando en 1', async () => {
    // Arrange
    const base = {
      title: 'Prod', description: 'desc', categoria: 'Cat', images: ['/uploads/products/a.jpg'], ownerId: 'u1'
    };

    // Act
    const p1 = await new Product(base).save();
    const p2 = await new Product({ ...base, title: 'Prod 2' }).save();

    // Assert
    expect(p1.id).to.equal(1);
    expect(p2.id).to.equal(2);
  });

  it('debería fallar si falta cualquier campo requerido (title, description, categoria, ownerId)', async () => {
    // Arrange
    const base = { title: 'T', description: 'D', categoria: 'C', images: ['/x.jpg'], ownerId: 'u1' };

    for (const key of ['title', 'description', 'categoria', 'ownerId']) {
      // Act
      const bad = { ...base };
      delete bad[key];
      const err = new Product(bad).validateSync();

      // Assert
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      expect(err.errors).to.have.property(key);
    }
  });

  it('debería no guardar el campo caracteristicas cuando no se provee', async () => {
    // Arrange
    const doc = { title: 'X', description: 'Y', categoria: 'Z', images: ['/a.jpg'], ownerId: 'u1' };

    // Act
    const saved = await new Product(doc).save();

    // Assert
    expect(saved.toObject()).to.not.have.property('caracteristicas');
  });

  it('debería respetar la validación de caracteristicas: máximo 15 ítems y 1000 caracteres totales (Arrange, Act, Assert)', async () => {
    // Arrange
    const base = { title: 'T', description: 'D', categoria: 'C', images: ['/x.jpg'], ownerId: 'u1' };
    const ok15 = Array.from({ length: 15 }, (_, i) => `c${i}`);
    const tooMany = Array.from({ length: 16 }, (_, i) => `c${i}`);
    const tooLong = ['a'.repeat(1001)];

    // Act
    const ok = await new Product({ ...base, caracteristicas: ok15 }).save();

    // Assert
    expect(ok.caracteristicas).to.have.length(15);

    // Act + Assert casos inválidos
    try {
      await new Product({ ...base, caracteristicas: tooMany }).save();
      throw new Error('Se esperaba un error de validación por demasiadas caracteristicas');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    try {
      await new Product({ ...base, caracteristicas: tooLong }).save();
      throw new Error('Se esperaba un error de validación por caracteristicas demasiado largas');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }
  });

  it('debería fallar si cualquier campo requerido está vacío (cadenas vacías)', async () => {
    // Arrange
    const base = { title: 'T', description: 'D', categoria: 'C', images: ['/x.jpg'], ownerId: 'u1' };

    // Act
    const cases = [
      { ...base, title: '' },
      { ...base, description: '' },
      { ...base, categoria: '' },
      { ...base, ownerId: '' }
    ];

    // Assert
    for (const bad of cases) {
      const err = new Product(bad).validateSync();
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }
  });
});
