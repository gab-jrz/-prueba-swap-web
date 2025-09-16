import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import Message from '../../src/models/Message.js';

// Pruebas AAA para el modelo Message

describe('Pruebas Message', function () {
  it('debería crear un mensaje válido con los campos requeridos', async () => {
    // Arrange
    const data = {
      de: 'Alice',
      deId: 'user-1',
      paraId: 'user-2',
      paraNombre: 'Bob',
      productoOfrecido: 'Libro',
      descripcion: 'Hola, te interesa un intercambio?',
      productoId: '10',
      productoTitle: 'Pelota'
    };

    // Act
    const msg = new Message(data);
    const saved = await msg.save();

    // Assert (valores por defecto y campos persistidos)
    expect(saved.de).to.equal('Alice');
    expect(saved.tipoPeticion).to.equal('intercambio'); // default
    expect(saved.leidoPor).to.deep.equal([]); // default
    expect(saved.system).to.equal(false); // default
    expect(saved.confirmaciones).to.deep.equal([]); // default
    expect(saved.completed).to.equal(false); // default
    expect(saved.deleted).to.equal(false); // default
    expect(saved).to.have.property('createdAt');
    expect(saved).to.have.property('updatedAt');
  });

  it('debería requerir campos básicos', async () => {
    // Arrange: base válida
    const base = {
      de: 'Alice',
      deId: 'user-1',
      paraId: 'user-2',
      paraNombre: 'Bob',
      productoOfrecido: 'Libro',
      descripcion: 'Texto'
    };

    // Act + Assert: faltar cada campo requerido
    for (const key of ['de', 'deId', 'paraId', 'paraNombre', 'productoOfrecido', 'descripcion']) {
      const bad = { ...base };
      delete bad[key];
      try {
        await new Message(bad).save();
        throw new Error(`Se esperaba error de validación por ausencia de ${key}`);
      } catch (err) {
        expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      }
    }
  });

  it('debería validar límites de rating 1..5', async () => {
    // Arrange
    const base = {
      de: 'Alice',
      deId: 'user-1',
      paraId: 'user-2',
      paraNombre: 'Bob',
      productoOfrecido: 'Libro',
      descripcion: 'Texto'
    };

    // Act + Assert: inválido por bajo
    try {
      await new Message({ ...base, rating: 0 }).save();
      throw new Error('Se esperaba error de validación por rating < 1');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act + Assert: inválido por alto
    try {
      await new Message({ ...base, rating: 6 }).save();
      throw new Error('Se esperaba error de validación por rating > 5');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act: valores válidos en el borde
    const low = await new Message({ ...base, rating: 1 }).save();
    const high = await new Message({ ...base, rating: 5 }).save();

    // Assert
    expect(low.rating).to.equal(1);
    expect(high.rating).to.equal(5);
  });

  it('debería fallar si descripcion está vacía', async () => {
    // Arrange
    const doc = {
      de: 'A', deId: '1', paraId: '2', paraNombre: 'B', productoOfrecido: 'Libro', descripcion: ''
    };

    // Act
    const err = new Message(doc).validateSync();

    // Assert
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('descripcion');
  });

  it('debería validar enum de tipoPeticion', async () => {
    // Arrange
    const base = { de: 'A', deId: '1', paraId: '2', paraNombre: 'B', productoOfrecido: 'Libro', descripcion: 'x' };

    // Act + Assert: inválido
    const err = new Message({ ...base, tipoPeticion: 'otro' }).validateSync();
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('tipoPeticion');

    // Act: válido
    const ok = await new Message({ ...base, tipoPeticion: 'mensaje' }).save();

    // Assert
    expect(ok.tipoPeticion).to.equal('mensaje');
  });
});
