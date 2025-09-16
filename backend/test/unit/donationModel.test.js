import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import Donation from '../../src/models/Donation.js';

describe('Pruebas donacion', function () {
  it('debería crear una donación válida con los campos requeridos', async () => {
    // Arrange
    const donorId = new mongoose.Types.ObjectId();
    const data = {
      title: 'Abrigo de invierno',
      description: 'Abrigo usado pero en buen estado',
      images: ['/uploads/donations/1.jpg'],
      category: 'Ropa',
      condition: 'Usado',
      location: 'CABA',
      donor: donorId,
      pickupMethod: 'Retiro en domicilio'
    };

    // Act
    const donation = new Donation(data);
    const saved = await donation.save();

    // Assert
    expect(saved.title).to.equal(data.title);
    expect(saved.images).to.deep.equal(data.images);
    expect(saved.category).to.equal('Ropa');
    expect(saved.status).to.equal('available'); // default
    expect(saved).to.have.property('createdAt');
  });

  it('debería requerir images con al menos un elemento', async () => {
    // Arrange
    const donorId = new mongoose.Types.ObjectId();
    const missingImages = {
      title: 'Silla',
      category: 'Hogar',
      donor: donorId
    };
    const emptyImages = {
      title: 'Silla',
      category: 'Hogar',
      donor: donorId,
      images: []
    };

    // Act + Assert
    try {
      await new Donation(missingImages).save();
      throw new Error('Se esperaba un error de validación por ausencia de imágenes');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    try {
      await new Donation(emptyImages).save();
      throw new Error('Se esperaba un error de validación por imágenes vacío');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      expect(err.errors?.images?.message).to.match(/al menos una imagen/i);
    }
  });

  it('debería requerir category y donor', async () => {
    // Arrange
    const base = { title: 'Libro', images: ['/u.jpg'] };

    // Act + Assert falta category
    try {
      await new Donation({ ...base, donor: new mongoose.Types.ObjectId() }).save();
      throw new Error('Se esperaba un error de validación por ausencia de categoría');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act + Assert falta donor
    try {
      await new Donation({ ...base, category: 'Libros' }).save();
      throw new Error('Se esperaba un error de validación por ausencia de donante');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }
  });

  it('debería incluir el mensaje de validador cuando images está vacío', async () => {
    // Arrange
    const donorId = new mongoose.Types.ObjectId();
    const doc = { title: 'Silla', category: 'Hogar', donor: donorId, images: [] };

    // Act
    const err = new Donation(doc).validateSync();

    // Assert
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors?.images?.message).to.match(/al menos una imagen|Debes subir al menos una imagen/i);
  });

  it('debería validar enum de status', async () => {
    // Arrange
    const donorId = new mongoose.Types.ObjectId();
    const base = { title: 'Mesa', category: 'Hogar', donor: donorId, images: ['/a.jpg'] };

    // Act + Assert inválido
    const err = new Donation({ ...base, status: 'otro' }).validateSync();
    expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    expect(err.errors).to.have.property('status');

    // Act válido
    const ok = await new Donation({ ...base, status: 'reserved' }).save();
    expect(ok.status).to.equal('reserved');
  });

  it('debería asignar defaults y permitir campos opcionales', async () => {
    // Arrange
    const donorId = new mongoose.Types.ObjectId();
    const doc = { title: 'Abrigo', category: 'Ropa', donor: donorId, images: ['/a.jpg'], condition: 'Usado' };

    // Act
    const saved = await new Donation(doc).save();

    // Assert
    expect(saved.status).to.equal('available');
    expect(saved).to.have.property('createdAt');
    expect(saved.condition).to.equal('Usado');
  });
});
