// Email service using nodemailer with Turbopack/Next.js compatibility

const EMAIL_TIMEOUT_MS = 30000 // 30 seconds max for entire email operation

// Helper to add timeout to any promise
const withTimeout = (promise, ms, operation = 'Operation') => {
  let timeoutId
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${operation} timed out after ${ms}ms`))
    }, ms)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

// Create transporter for each request to avoid connection issues
const createTransporter = async () => {
  // Dynamic import of nodemailer for Turbopack compatibility
  const nodemailer = await import('nodemailer');
  const mailer = nodemailer.default ? nodemailer.default : nodemailer;

  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.error('SMTP configuration missing. Please set SMTP_HOST and SMTP_PORT environment variables.');
    throw new Error('Email service not configured');
  }

  const port = parseInt(process.env.SMTP_PORT);
  const isSecure = port === 465;

  const transporterConfig = {
    host: process.env.SMTP_HOST,
    port: port,
    secure: isSecure,
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
    pool: false,
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  };

  // Log the nodemailer object structure in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Nodemailer loaded:', typeof mailer.createTransporter);
  }

  return mailer.createTransport(transporterConfig);
};

// Base email sending function
const sendEmail = async ({ to, subject, html, text, attachments = [], cc = [] }) => {
  let transporter = null;

  try {
    // Create new transporter for each request
    transporter = await createTransporter();

    // Filter and validate CC emails
    const validCC = cc && Array.isArray(cc) 
      ? cc.filter(email => email && typeof email === 'string' && email.trim().length > 0)
      : [];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@codegroupsolutions.com',
      to,
      subject,
      html,
      text: text || subject,
      attachments,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'nodemailer'
      }
    };

    // Add CC only if there are valid emails
    if (validCC.length > 0) {
      mailOptions.cc = validCC;
    }

    // Log email details for debugging
    console.log('Sending email:', {
      to,
      cc: validCC.length > 0 ? validCC : 'none',
      subject,
      hasAttachments: attachments.length > 0,
      mailOptionsKeys: Object.keys(mailOptions)
    });

    // Verify transporter connection in development
    if (process.env.NODE_ENV === 'development') {
      try {
        await transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (verifyError) {
        console.warn('SMTP verification failed:', verifyError.message);
      }
    }

    const info = await withTimeout(
      transporter.sendMail(mailOptions),
      EMAIL_TIMEOUT_MS,
      'Email send'
    );
    console.log('Email sent successfully:', info.messageId);

    // Close transporter after sending
    if (transporter && typeof transporter.close === 'function') {
      transporter.close();
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);

    // Ensure transporter is closed on error
    if (transporter && typeof transporter.close === 'function') {
      transporter.close();
    }

    return { success: false, error: error.message };
  }
};

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email Templates
const emailTemplates = {
  // Base HTML template wrapper
  baseTemplate: (content) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #000000; color: #ffffff; padding: 30px; text-align: center; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f8f8f8; padding: 20px; text-align: center; color: #666666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .code-box { background-color: #f8f8f8; border: 2px dashed #333333; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center; }
          .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000000; }
          .warning { background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px; color: #856404; }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
          <div class="footer">
            <p>&copy; 2025 CLIMIO. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responder.</p>
          </div>
        </div>
      </body>
    </html>
  `,

  // Verification code template
  verificationCode: (code) => `
    <div class="header">
      <h1 style="margin: 0;">SuperAdmin CRM</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Verificación de Acceso</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Tu Código de Verificación</h2>
      <p style="color: #666666; line-height: 1.6;">
        Has solicitado acceso al panel de Climio. Utiliza el siguiente código para completar tu autenticación:
      </p>
      <div class="code-box">
        <div class="code">${code}</div>
      </div>
      <p style="color: #666666; line-height: 1.6;">
        Este código expirará en <strong>10 minutos</strong>.
      </p>
      <div class="warning">
        <strong>⚠️ Importante:</strong> Si no solicitaste este código, ignora este correo.
        No compartas este código con nadie.
      </div>
    </div>
  `,

  // Welcome email template
  welcome: (companyName, adminName) => `
    <div class="header">
      <h1 style="margin: 0;">Bienvenido a CRM</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Tu cuenta ha sido creada</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">¡Hola ${adminName}!</h2>
      <p style="color: #666666; line-height: 1.6;">
        Tu compañía <strong>${companyName}</strong> ha sido registrada exitosamente en nuestro sistema CRM.
      </p>
      <p style="color: #666666; line-height: 1.6;">
        Ya puedes acceder al sistema y comenzar a gestionar tu negocio.
      </p>
      <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" class="button">
        Iniciar Sesión
      </a>
    </div>
  `,

  // Invoice notification template
  invoice: (invoiceNumber, clientName, amount) => `
    <div class="header">
      <h1 style="margin: 0;">Nueva Factura</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Factura #${invoiceNumber}</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Estimado/a ${clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        Le informamos que tiene una nueva factura disponible.
      </p>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Número de Factura:</strong> ${invoiceNumber}</p>
        <p style="margin: 5px 0;"><strong>Monto Total:</strong> $${amount}</p>
      </div>
      <p style="color: #666666; line-height: 1.6;">
        Por favor, realice el pago a la brevedad posible.
      </p>
    </div>
  `,

  // Quote template
  quote: (quoteNumber, clientName, total, validUntil, items = []) => `
    <div class="header">
      <h1 style="margin: 0;">Cotización</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Propuesta #${quoteNumber}</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Estimado/a ${clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        Adjunto encontrará la cotización solicitada. Estamos a su disposición para cualquier consulta.
      </p>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Cotización #:</strong> ${quoteNumber}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> $${total}</p>
        <p style="margin: 5px 0;"><strong>Válida hasta:</strong> ${validUntil}</p>
      </div>
      ${items.length > 0 ? `
        <h3 style="color: #333333;">Detalle de servicios:</h3>
        <ul style="color: #666666; line-height: 1.8;">
          ${items.map(item => `<li>${item.description} - Cantidad: ${item.quantity}</li>`).join('')}
        </ul>
      ` : ''}
      <p style="color: #666666; line-height: 1.6;">
        Esta cotización es válida por los próximos 30 días. Por favor, contáctenos para confirmar o si tiene alguna pregunta.
      </p>
    </div>
  `,

  // Appointment reminder template
  appointment: (clientName, date, time, technicianName) => `
    <div class="header">
      <h1 style="margin: 0;">Recordatorio de Cita</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Servicio Programado</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Hola ${clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        Le recordamos que tiene una cita programada para servicio técnico.
      </p>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Hora:</strong> ${time}</p>
        <p style="margin: 5px 0;"><strong>Técnico:</strong> ${technicianName}</p>
      </div>
      <p style="color: #666666; line-height: 1.6;">
        Por favor, asegúrese de estar disponible en el horario indicado.
      </p>
    </div>
  `,

  // New appointment created template
  appointmentCreated: (appointmentData) => `
    <div class="header">
      <h1 style="margin: 0;">Nueva Cita Programada</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Confirmación de Servicio</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Hola ${appointmentData.clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        Su cita de servicio ha sido programada exitosamente. A continuación, los detalles:
      </p>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Título:</strong> ${appointmentData.title}</p>
        <p style="margin: 8px 0;"><strong>Tipo de Servicio:</strong> ${appointmentData.type}</p>
        <p style="margin: 8px 0;"><strong>Fecha:</strong> ${appointmentData.date}</p>
        <p style="margin: 8px 0;"><strong>Hora:</strong> ${appointmentData.time}</p>
        ${appointmentData.endTime ? `<p style="margin: 8px 0;"><strong>Hora de Finalización:</strong> ${appointmentData.endTime}</p>` : ''}
        ${appointmentData.technicianName ? `<p style="margin: 8px 0;"><strong>Técnico Asignado:</strong> ${appointmentData.technicianName}</p>` : ''}
        ${appointmentData.location ? `<p style="margin: 8px 0;"><strong>Ubicación:</strong> ${appointmentData.location}</p>` : ''}
      </div>
      ${appointmentData.description ? `
        <h3 style="color: #333333; margin-top: 20px;">Descripción del Servicio:</h3>
        <p style="color: #666666; line-height: 1.6; background-color: #f8f8f8; padding: 15px; border-radius: 5px;">
          ${appointmentData.description}
        </p>
      ` : ''}
      <p style="color: #666666; line-height: 1.6; margin-top: 20px;">
        Si tiene alguna pregunta o necesita reprogramar, por favor contáctenos.
      </p>
    </div>
  `,

  // Appointment status changed template
  appointmentStatusChanged: (appointmentData) => `
    <div class="header">
      <h1 style="margin: 0;">Actualización de Cita</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Estado de Servicio</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Hola ${appointmentData.clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        El estado de su cita de servicio ha sido actualizado:
      </p>
      <div style="background-color: ${appointmentData.statusColor}; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${appointmentData.statusBorder};">
        <p style="margin: 8px 0; font-size: 18px;"><strong>Nuevo Estado:</strong> <span style="color: ${appointmentData.statusBorder};">${appointmentData.statusText}</span></p>
      </div>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Título:</strong> ${appointmentData.title}</p>
        <p style="margin: 8px 0;"><strong>Tipo de Servicio:</strong> ${appointmentData.type}</p>
        <p style="margin: 8px 0;"><strong>Fecha:</strong> ${appointmentData.date}</p>
        <p style="margin: 8px 0;"><strong>Hora:</strong> ${appointmentData.time}</p>
        ${appointmentData.technicianName ? `<p style="margin: 8px 0;"><strong>Técnico:</strong> ${appointmentData.technicianName}</p>` : ''}
      </div>
      ${appointmentData.notes ? `
        <h3 style="color: #333333; margin-top: 20px;">Notas:</h3>
        <p style="color: #666666; line-height: 1.6; background-color: #fff9e6; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
          ${appointmentData.notes}
        </p>
      ` : ''}
      <p style="color: #666666; line-height: 1.6; margin-top: 20px;">
        Gracias por su preferencia.
      </p>
    </div>
  `,

  // Appointment completed template with tasks
  appointmentCompleted: (appointmentData) => `
    <div class="header">
      <h1 style="margin: 0;">Servicio Completado</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Resumen del Trabajo Realizado</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Hola ${appointmentData.clientName}</h2>
      <p style="color: #666666; line-height: 1.6;">
        Su servicio ha sido completado exitosamente. A continuación, el resumen detallado:
      </p>

      <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <p style="margin: 0; font-size: 18px; color: #155724;"><strong>✓ Servicio Completado</strong></p>
      </div>

      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>Título:</strong> ${appointmentData.title}</p>
        <p style="margin: 8px 0;"><strong>Tipo de Servicio:</strong> ${appointmentData.type}</p>
        <p style="margin: 8px 0;"><strong>Fecha:</strong> ${appointmentData.date}</p>
        <p style="margin: 8px 0;"><strong>Técnico:</strong> ${appointmentData.technicianName || 'No asignado'}</p>
      </div>

      ${appointmentData.tasks && appointmentData.tasks.length > 0 ? `
        <h3 style="color: #333333; margin-top: 25px;">Tareas Realizadas:</h3>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px;">
          <ul style="color: #666666; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${appointmentData.tasks.map(task => `
              <li style="margin-bottom: 10px;">
                <span style="color: #28a745;">✓</span> ${task.description}
                ${task.completedAt ? `<br><small style="color: #999;">Completada: ${task.completedAt}</small>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${appointmentData.pendingTasks && appointmentData.pendingTasks.length > 0 ? `
        <h3 style="color: #333333; margin-top: 25px;">Recomendaciones / Tareas Pendientes:</h3>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107;">
          <ul style="color: #856404; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${appointmentData.pendingTasks.map(task => `
              <li style="margin-bottom: 10px;">
                ${task.description}
                ${task.createdAt ? `<br><small style="color: #856404;">Creada: ${task.createdAt}</small>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      ` : ''}

      ${appointmentData.notes ? `
        <h3 style="color: #333333; margin-top: 25px;">Notas del Técnico:</h3>
        <p style="color: #666666; line-height: 1.6; background-color: #e7f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3;">
          ${appointmentData.notes}
        </p>
      ` : ''}

      <p style="color: #666666; line-height: 1.6; margin-top: 25px;">
        Gracias por confiar en nuestros servicios. Si tiene alguna pregunta sobre el trabajo realizado,
        no dude en contactarnos.
      </p>
    </div>
  `
};

// Specific email sending functions
const sendVerificationEmail = async (email, code) => {
  const html = emailTemplates.baseTemplate(emailTemplates.verificationCode(code));
  const text = `Tu código de verificación para Climio CRM es: ${code}\n\nEste código expirará en 10 minutos.\n\nSi no solicitaste este código, ignora este correo.`;

  return sendEmail({
    to: email,
    subject: 'Código de Verificación - Climio CRM',
    html,
    text
  });
};

const sendWelcomeEmail = async (email, companyName, adminName) => {
  const html = emailTemplates.baseTemplate(emailTemplates.welcome(companyName, adminName));
  const text = `Hola ${adminName}, tu compañía ${companyName} ha sido registrada exitosamente en nuestro sistema CRM.`;

  return sendEmail({
    to: email,
    subject: 'Bienvenido a CRM',
    html,
    text
  });
};

const sendInvoiceEmail = async (email, invoiceNumber, clientName, amount, pdfBuffer = null, cc = []) => {
  const html = emailTemplates.baseTemplate(emailTemplates.invoice(invoiceNumber, clientName, amount));
  const text = `Estimado/a ${clientName}, tiene una nueva factura #${invoiceNumber} por $${amount}.`;

  const attachments = pdfBuffer ? [{
    filename: `factura-${invoiceNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }] : [];

  console.log('sendInvoiceEmail called with:', {
    to: email,
    cc: cc,
    invoiceNumber,
    hasPDF: !!pdfBuffer
  });

  return sendEmail({
    to: email,
    subject: `Factura #${invoiceNumber}`,
    html,
    text,
    attachments,
    cc: Array.isArray(cc) ? cc : []
  });
};

const sendQuoteEmail = async (email, quoteNumber, clientName, total, validUntil, items = [], pdfBuffer = null, cc = []) => {
  const html = emailTemplates.baseTemplate(emailTemplates.quote(quoteNumber, clientName, total, validUntil, items));
  const text = `Estimado/a ${clientName}, adjunto encontrará la cotización #${quoteNumber} por un total de $${total}. Válida hasta ${validUntil}.`;

  const attachments = pdfBuffer ? [{
    filename: `cotizacion-${quoteNumber}.pdf`,
    content: pdfBuffer,
    contentType: 'application/pdf'
  }] : [];

  console.log('sendQuoteEmail called with:', {
    to: email,
    cc: cc,
    quoteNumber,
    hasPDF: !!pdfBuffer
  });

  return sendEmail({
    to: email,
    subject: `Cotización #${quoteNumber}`,
    html,
    text,
    attachments,
    cc: Array.isArray(cc) ? cc : []
  });
};

const sendAppointmentReminder = async (email, clientName, date, time, technicianName) => {
  const html = emailTemplates.baseTemplate(emailTemplates.appointment(clientName, date, time, technicianName));
  const text = `Hola ${clientName}, le recordamos que tiene una cita programada el ${date} a las ${time} con el técnico ${technicianName}.`;

  return sendEmail({
    to: email,
    subject: 'Recordatorio de Cita - Servicio Técnico',
    html,
    text
  });
};

const sendAppointmentCreatedEmail = async (email, appointmentData) => {
  const html = emailTemplates.baseTemplate(emailTemplates.appointmentCreated(appointmentData));
  const text = `Hola ${appointmentData.clientName}, su cita de servicio "${appointmentData.title}" ha sido programada para el ${appointmentData.date} a las ${appointmentData.time}.`;

  return sendEmail({
    to: email,
    subject: 'Nueva Cita Programada - Confirmación de Servicio',
    html,
    text
  });
};

const sendAppointmentStatusEmail = async (email, appointmentData) => {
  const html = emailTemplates.baseTemplate(emailTemplates.appointmentStatusChanged(appointmentData));
  const text = `Hola ${appointmentData.clientName}, el estado de su cita "${appointmentData.title}" ha cambiado a: ${appointmentData.statusText}.`;

  return sendEmail({
    to: email,
    subject: `Actualización de Cita - ${appointmentData.statusText}`,
    html,
    text
  });
};

const sendAppointmentCompletedEmail = async (email, appointmentData) => {
  const html = emailTemplates.baseTemplate(emailTemplates.appointmentCompleted(appointmentData));

  let tasksText = '';
  if (appointmentData.tasks && appointmentData.tasks.length > 0) {
    tasksText = '\n\nTareas Realizadas:\n' + appointmentData.tasks.map(t => `- ${t.description}`).join('\n');
  }

  let pendingTasksText = '';
  if (appointmentData.pendingTasks && appointmentData.pendingTasks.length > 0) {
    pendingTasksText = '\n\nRecomendaciones / Tareas Pendientes:\n' + appointmentData.pendingTasks.map(t => `- ${t.description}`).join('\n');
  }

  const text = `Hola ${appointmentData.clientName}, su servicio "${appointmentData.title}" ha sido completado.${tasksText}${pendingTasksText}`;

  return sendEmail({
    to: email,
    subject: 'Servicio Completado - Resumen del Trabajo Realizado',
    html,
    text
  });
};

// Demo request email function
const sendDemoRequestEmail = async (demoData) => {
  const { name, email, phone, businessName, preferredDate, preferredTime } = demoData;

  // HTML template for demo request
  const demoRequestHtml = `
    <div class="header">
      <h1 style="margin: 0;">Nueva Solicitud de Demostración</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">CLIMIO CRM</p>
    </div>
    <div class="content">
      <h2 style="color: #333333;">Detalles del Contacto:</h2>
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Nombre:</strong> ${name}</p>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 10px 0;"><strong>Teléfono:</strong> ${phone}</p>
        <p style="margin: 10px 0;"><strong>Nombre del Negocio:</strong> ${businessName}</p>
        <p style="margin: 10px 0;"><strong>Fecha Preferida:</strong> ${preferredDate}</p>
        <p style="margin: 10px 0;"><strong>Hora Preferida:</strong> ${preferredTime}</p>
      </div>
      <p style="color: #666666; line-height: 1.6;">
        Este cliente está interesado en una demostración del sistema CRM. Por favor, contactarlo lo antes posible para confirmar la cita.
      </p>
    </div>
  `;

  const html = emailTemplates.baseTemplate(demoRequestHtml);
  const text = `Nueva solicitud de demostración de:
    Nombre: ${name}
    Email: ${email}
    Teléfono: ${phone}
    Negocio: ${businessName}
    Fecha: ${preferredDate}
    Hora: ${preferredTime}`;

  // Send to admin email (configured in EMAIL_TO env variable)
  const adminEmail = process.env.EMAIL_TO || process.env.EMAIL_FROM;

  return sendEmail({
    to: adminEmail,
    subject: `Nueva Solicitud de Demo - ${name}`,
    html,
    text
  });
};

// Export all functions
module.exports = {
  sendEmail,
  generateVerificationCode,
  emailTemplates,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendInvoiceEmail,
  sendQuoteEmail,
  sendAppointmentReminder,
  sendAppointmentCreatedEmail,
  sendAppointmentStatusEmail,
  sendAppointmentCompletedEmail,
  sendDemoRequestEmail
};