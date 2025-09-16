import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Log de configuración inicial
console.log('=== Configuración de entorno ===');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('CONTACT_EMAIL_USER:', process.env.CONTACT_EMAIL_USER ? 'Definido' : 'No definido');
console.log('CONTACT_EMAIL_PASS:', process.env.CONTACT_EMAIL_PASS ? 'Definido' : 'No definido');
console.log('===============================');

const isProduction = process.env.NODE_ENV === 'production';
let transporter; // se inicializa perezosamente

router.post('/', async (req, res) => {
  console.log('\n=== Nueva petición POST a /api/contacto ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body recibido:', JSON.stringify(req.body, null, 2));

  try {
    // Validación de campos
    const { nombre, email, categoria, descripcion } = req.body;
    
    if (!nombre || !email || !categoria || !descripcion) {
      console.error('Error de validación: Faltan campos requeridos');
      return res.status(400).json({ 
        ok: false, 
        error: 'Todos los campos son obligatorios' 
      });
    }

    // Inicializar transporter
    if (!transporter) {
      if (isProduction) {
        console.log('Inicializando transporter de producción (Gmail)');
        if (!process.env.CONTACT_EMAIL_USER || !process.env.CONTACT_EMAIL_PASS) {
          const error = 'Faltan variables de entorno: CONTACT_EMAIL_USER o CONTACT_EMAIL_PASS';
          console.error(error);
          return res.status(500).json({ ok: false, error });
        }
        
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.CONTACT_EMAIL_USER,
            pass: process.env.CONTACT_EMAIL_PASS,
          },
        });
        
        // Verificar la conexión
        try {
          await transporter.verify();
          console.log('Conexión SMTP verificada correctamente');
        } catch (error) {
          console.error('Error al verificar la conexión SMTP:', error);
          return res.status(500).json({ 
            ok: false, 
            error: 'Error de configuración del servidor de correo' 
          });
        }
      } else {
        console.log('Modo desarrollo: Usando Ethereal');
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal user:', testAccount.user);
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }
    }

    // Configurar opciones del correo
    const mailOptions = {
      from: `"${nombre}" <${isProduction ? process.env.CONTACT_EMAIL_USER : 'no-reply@ethereal.email'}>`,
      to: isProduction ? 'swapwebtuc@gmail.com' : 'test@ethereal.email',
      subject: `Contacto desde SwapWeb: ${categoria}`,
      text: `
        Nombre: ${nombre}
        Email: ${email}
        Categoría: ${categoria}
        
        Mensaje:
        ${descripcion}
        
        ---
        Este mensaje fue enviado desde el formulario de contacto de SwapWeb.
      `,
      replyTo: email,
    };

    console.log('Enviando correo con opciones:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo,
    });

    // Enviar correo
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Mensaje enviado: %s', info.messageId);
    if (!isProduction) {
      console.log('URL de vista previa: %s', nodemailer.getTestMessageUrl(info));
    }

    res.json({ 
      ok: true, 
      messageId: info.messageId,
      message: 'Mensaje enviado correctamente' 
    });

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ 
      ok: false, 
      error: error.message || 'Error al enviar el mensaje',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
