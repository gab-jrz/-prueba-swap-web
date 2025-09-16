import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import Notification from '../../src/models/Notification.js';

describe('Pruebas Notification', function () {
  it('debería crear una notificación válida con campos requeridos', async () => {
    // Arrange
    const data = {
      userId: 'user-123',
      type: 'mensaje_directo',
      title: 'Nuevo mensaje',
      message: 'Tienes un nuevo mensaje'
    };

    // Act
    const notif = new Notification(data);
    const saved = await notif.save();

    // Assert
    expect(saved.userId).to.equal('user-123');
    expect(saved.type).to.equal('mensaje_directo');
    expect(saved.title).to.equal('Nuevo mensaje');
    expect(saved.message).to.equal('Tienes un nuevo mensaje');
    expect(saved.read).to.equal(false); // default
    expect(saved.priority).to.equal('medium'); // default
    expect(saved.expiresAt).to.be.instanceOf(Date);
    expect(saved).to.have.property('createdAt');
    expect(saved).to.have.property('updatedAt');
  });

  it('debería requerir userId, type, title y message', async () => {
    // Arrange
    const base = { userId: 'u1', type: 'recordatorio', title: 't', message: 'm' };

    // Act + Assert: faltantes
    for (const key of ['userId', 'type', 'title', 'message']) {
      const bad = { ...base };
      delete bad[key];
      try {
        await new Notification(bad).save();
        throw new Error(`Se esperaba error de validación por ausencia de ${key}`);
      } catch (err) {
        expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      }
    }
  });

  it('debería validar enum de type y priority', async () => {
    // Arrange
    const base = { userId: 'u1', title: 't', message: 'm' };

    // Act + Assert: type inválido
    try {
      await new Notification({ ...base, type: 'invalido' }).save();
      throw new Error('Se esperaba error de validación por type inválido');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act + Assert: priority inválido
    try {
      await new Notification({ ...base, type: 'recordatorio', priority: 'urgent' }).save();
      throw new Error('Se esperaba error de validación por priority inválido');
    } catch (err) {
      expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
    }

    // Act: priority válido
    const ok = await new Notification({ ...base, type: 'recordatorio', priority: 'high' }).save();

    // Assert
    expect(ok.priority).to.equal('high');
  });
});
