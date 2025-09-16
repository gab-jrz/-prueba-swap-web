import { expect } from '../helpers/testHelper.js';
import mongoose from 'mongoose';
import User from '../../src/models/User.js';

describe('Pruebas User', function () {
  it('debería crear un usuario válido y hashear la contraseña', async () => {
    // Arrange
    const plain = 'MiPass#123';
    const data = {
      id: 'u-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
      password: plain
    };

    // Act
    const user = new User(data);
    const saved = await user.save();

    // Assert
    expect(saved.id).to.equal('u-1');
    expect(saved.email).to.equal('juan@example.com');
    expect(saved.password).to.be.a('string');
    expect(saved.password).to.not.equal(plain); // hasheada por pre('save')
    expect(saved.username).to.equal('juanpérez'); // default a partir de nombre+apellido en minúsculas
    expect(saved.calificacion).to.equal(1); // default
    expect(saved).to.have.property('createdAt');
    expect(saved).to.have.property('updatedAt');

    // Act: verificar comparePassword
    const ok = await saved.comparePassword(plain);

    // Assert
    expect(ok).to.equal(true);
  });

  it('debería requerir id, nombre, apellido, email y password', async () => {
    // Arrange
    const base = { id: 'u-2', nombre: 'Ana', apellido: 'García', email: 'ana@example.com', password: '123456' };

    // Act + Assert: faltar cada requerido
    for (const key of ['id', 'nombre', 'apellido', 'email', 'password']) {
      const bad = { ...base };
      delete bad[key];
      try {
        await new User(bad).save();
        throw new Error(`Se esperaba error de validación por ausencia de ${key}`);
      } catch (err) {
        expect(err).to.be.instanceOf(mongoose.Error.ValidationError);
      }
    }
  });

  it('debería respetar unicidad de email e id ', async () => {
    // Arrange
    const base = { id: 'u-3', nombre: 'Luz', apellido: 'Suárez', email: 'luz@example.com', password: 'abc123' };
    await new User(base).save();

    // Act + Assert: email duplicado
    try {
      await new User({ ...base, id: 'u-4' }).save();
      throw new Error('Se esperaba error de clave duplicada por email');
    } catch (err) {
      // Mongo 6+: MongoServerError con code 11000
      expect(err).to.have.property('code', 11000);
    }

    // Act + Assert: id duplicado
    try {
      await new User({ ...base, email: 'luz2@example.com' }).save();
      throw new Error('Se esperaba error de clave duplicada por id');
    } catch (err) {
      expect(err).to.have.property('code', 11000);
    }
  });

  it('debería permitir comparePassword=false para contraseña incorrecta', async () => {
    // Arrange
    const saved = await new User({
      id: 'u-5', nombre: 'Mia', apellido: 'Lopez', email: 'mia@example.com', password: 'Secreta!9'
    }).save();

    // Act
    const ok = await saved.comparePassword('otraCosa');

    // Assert
    expect(ok).to.equal(false);
  });
});
