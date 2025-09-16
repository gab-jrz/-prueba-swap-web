import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import DonationRequest from '../../src/models/DonationRequest.js';

describe('Pruebas DonationRequest', function () {
  it('debería crear una solicitud válida con los campos requeridos y defaults ', async () => {
    // Arrange
    const requesterId = new mongoose.Types.ObjectId();
    const data = {
      requester: requesterId,
      category: 'Ropa',
      needDescription: 'Necesito abrigos para invierno'
    };

    // Act
    const dr = new DonationRequest(data);
    const saved = await dr.save();

    // Assert
    expect(saved.requester.toString()).to.equal(requesterId.toString());
    expect(saved.category).to.equal('Ropa');
    expect(saved.needDescription).to.equal('Necesito abrigos para invierno');
    expect(saved.urgency).to.equal('med'); // default
    expect(saved.status).to.equal('open'); // default
    expect(saved.privacy).to.equal(false); // default
    expect(saved).to.have.property('createdAt');
  });

  it('debería fallar si falta requester', async () => {
    // Arrange
    const doc = { category: 'Hogar', needDescription: 'Necesito muebles' };

    // Act
    const err = new DonationRequest(doc).validateSync();

    // Assert
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('requester');
  });

  it('debería fallar si falta category', async () => {
    // Arrange
    const doc = { requester: new mongoose.Types.ObjectId(), needDescription: 'Necesito una mesa' };

    // Act
    const err = new DonationRequest(doc).validateSync();

    // Assert
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('category');
  });

  it('debería fallar si falta needDescription', async () => {
    // Arrange
    const doc = { requester: new mongoose.Types.ObjectId(), category: 'Hogar' };

    // Act
    const err = new DonationRequest(doc).validateSync();

    // Assert
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('needDescription');
  });

  it('debería validar enum de urgency', async () => {
    // Arrange
    const base = {
      requester: new mongoose.Types.ObjectId(),
      category: 'Electrónica',
      needDescription: 'Necesito una notebook'
    };

    // Act + Assert: inválido
    const err = new DonationRequest({ ...base, urgency: 'urgent' }).validateSync();
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('urgency');

    // Act: válido
    const ok = await new DonationRequest({ ...base, urgency: 'high' }).save();

    // Assert
    expect(ok.urgency).to.equal('high');
  });

  it('debería validar enum de status', async () => {
    // Arrange
    const base = {
      requester: new mongoose.Types.ObjectId(),
      category: 'Hogar',
      needDescription: 'Necesito una heladera'
    };

    // Act + Assert: inválido
    const err = new DonationRequest({ ...base, status: 'finished' }).validateSync();
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('status');

    // Act: válido
    const ok = await new DonationRequest({ ...base, status: 'assigned' }).save();

    // Assert
    expect(ok.status).to.equal('assigned');
  });
});
