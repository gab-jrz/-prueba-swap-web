import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import Swap from '../../src/models/Swap.js';

describe('Pruebas Swap', function () {
  it('debería crear un swap válido con campos requeridos', async () => {
    // Arrange
    const data = {
      itemOffered: new mongoose.Types.ObjectId(),
      itemRequested: new mongoose.Types.ObjectId(),
      offerUser: new mongoose.Types.ObjectId(),
      requestUser: new mongoose.Types.ObjectId()
    };

    // Act
    const swap = new Swap(data);
    const saved = await swap.save();

    // Assert
    expect(saved.status).to.equal('pendiente'); // default
    expect(saved.itemOffered).to.be.instanceOf(mongoose.Types.ObjectId);
    expect(saved.itemRequested).to.be.instanceOf(mongoose.Types.ObjectId);
    expect(saved.offerUser).to.be.instanceOf(mongoose.Types.ObjectId);
    expect(saved.requestUser).to.be.instanceOf(mongoose.Types.ObjectId);
    expect(saved).to.have.property('createdAt');
    expect(saved).to.have.property('updatedAt');
  });

  it('debería requerir itemOffered, itemRequested, offerUser y requestUser', async () => {
    // Arrange
    const base = {
      itemOffered: new mongoose.Types.ObjectId(),
      itemRequested: new mongoose.Types.ObjectId(),
      offerUser: new mongoose.Types.ObjectId(),
      requestUser: new mongoose.Types.ObjectId()
    };

    // Act + Assert: faltantes
    for (const key of ['itemOffered', 'itemRequested', 'offerUser', 'requestUser']) {
      const bad = { ...base };
      delete bad[key];
      try {
        await new Swap(bad).save();
        throw new Error(`Se esperaba error de validación por ausencia de ${key}`);
      } catch (err) {
        expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      }
    }
  });

  it('debería validar enum de status', async () => {
    // Arrange
    const base = {
      itemOffered: new mongoose.Types.ObjectId(),
      itemRequested: new mongoose.Types.ObjectId(),
      offerUser: new mongoose.Types.ObjectId(),
      requestUser: new mongoose.Types.ObjectId()
    };

    // Act + Assert: status inválido
    try {
      await new Swap({ ...base, status: 'otro' }).save();
      throw new Error('Se esperaba error de validación por status inválido');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act: status válido
    const ok = await new Swap({ ...base, status: 'aceptado' }).save();

    // Assert
    expect(ok.status).to.equal('aceptado');
  });
});
