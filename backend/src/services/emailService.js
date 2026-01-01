import nodemailer from 'nodemailer';
import config from '../config/index.js';

// Crear transporter de nodemailer
const createTransporter = () => {
  // Solo crear si hay credenciales configuradas
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('SMTP no configurado. Los emails no se enviarán.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
};

const transporter = createTransporter();

/**
 * Envía email de recuperación de contraseña
 * @param {string} email - Email del destinatario
 * @param {string} token - Token de recuperación
 * @param {string} nombre - Nombre del usuario
 */
export const sendPasswordResetEmail = async (email, token, nombre) => {
  if (!transporter) {
    console.log(`[DEV] Email de recuperación para ${email}:`);
    console.log(`[DEV] Token: ${token}`);
    console.log(`[DEV] URL: ${config.frontendUrl}/reset-password/${token}`);
    return;
  }

  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: config.smtp.from,
    to: email,
    subject: 'Recuperación de contraseña - Sistema Hacienda',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #166534; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Sistema Hacienda</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Recuperación de contraseña</h2>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                      Hola <strong>${nombre}</strong>,
                    </p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                      Haz clic en el siguiente botón para crear una nueva contraseña:
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; background-color: #166534; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                            Restablecer contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #999999; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                      Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #eeeeee;">
                    <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
                      Sistema Hacienda - Gestión de Cortes<br>
                      Este es un correo automático, por favor no responder.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email de recuperación enviado a ${email}`);
  } catch (error) {
    console.error('Error enviando email:', error);
    throw new Error('Error al enviar el correo de recuperación');
  }
};

export default {
  sendPasswordResetEmail
};
