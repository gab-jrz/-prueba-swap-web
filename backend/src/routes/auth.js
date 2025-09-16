import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// Transporter: se crea solo si hay SMTP real; de lo contrario se usará Ethereal dinámicamente.
let transporter = null;
if (process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// POST /api/auth/forgot-password  { email }
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Generar token y fecha expiración
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600 * 1000; // 1 hora
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

    // Enviar email (o log si no hay SMTP)
    const mailOptions = {
      from: 'no-reply@swapweb.com',
      to: user.email,
      subject: 'Recuperar contraseña',
      text: `Hola ${user.nombre},\n\nPara restablecer tu contraseña haz clic en el siguiente enlace:\n${resetUrl}\n\nEl enlace expirará en 1 hora.\n\nSi no solicitaste esto, ignora este correo.`
    };

    let previewUrl = null;
    if (!transporter) {
      // Crear cuenta de prueba Ethereal la primera vez
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const info = await transporter.sendMail(mailOptions);
    if (nodemailer.getTestMessageUrl(info)) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Vista previa del correo:', previewUrl);
    }

    res.json({ message: 'Se envió un correo con instrucciones para restablecer la contraseña', previewUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el proceso' });
  }
});

// POST /api/auth/reset-password/:token  { newPassword }
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Token inválido o expirado' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al restablecer la contraseña' });
  }
});

export default router;
