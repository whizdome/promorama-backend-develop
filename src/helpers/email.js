const sgMail = require('@sendgrid/mail');

const logger = require('../utils/customLogger');
const { ROLE } = require('./constants');
const { generateInitiativeWeeklyReportHtml } = require('./templates/initiativeWeeklyReport');
const { generateInitiativeMessagesReportHtml } = require('./templates/initiativeMessagesReport');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/** Sends generic email
 * @param {{email: string, subject: string, htmlData: string, attachmentsData?: Array<object> }} transportObject
 */
const sendEmail = (transportObject) => {
  const mailData = {
    from: 'PromoRama <info@thepromorama.com>',
    to: transportObject.email,
    subject: transportObject.subject,
    html: transportObject.htmlData,
    attachments: transportObject.attachmentsData,
  };

  return sgMail.send(mailData);
};

/** Send a single email to multiple recipients where they don't see each other's email addresses
 * @param {{emails: string[], subject: string, htmlData: string, attachmentsData?: Array<object>}} transportObject
 */
const sendEmailToMultiple = (transportObject) => {
  const mailData = {
    from: 'PromoRama <info@thepromorama.com>',
    to: transportObject.emails,
    subject: transportObject.subject,
    html: transportObject.htmlData,
    attachments: transportObject.attachmentsData,
  };

  return sgMail.sendMultiple(mailData);
};

/** Sends email verification token
 * @param {{name: string, email: string, token: string}} data
 */
const sendEmailVerificationToken = (data) => {
  const { name, email, token } = data;

  const transportObject = {
    email,
    subject: 'Email Verification Token',
    htmlData: `<p>Hello ${name},</p><p>Please verify your email address by entering this code(expires in 10mins): <b>${token}</b></p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

/** Sends password reset token
 * @param {{name: string, email: string, token: string}} data
 */
const sendPasswordResetTokenEmail = (data) => {
  const { name, email, token } = data;

  const transportObject = {
    email,
    subject: 'Password Reset Token',
    htmlData: `<p>Hello ${name},</p><p>Please complete your password reset by entering this code(expires in 10mins): <b>${token}</b></p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

/** Sends login credentials
 * @param {{name: string, email: string, password: string}} data
 */
const sendLoginCredentialsEmail = (data) => {
  const { name, email, password } = data;

  const transportObject = {
    email,
    subject: 'Login Credentials',
    htmlData: `<p>Hello ${name},</p><p>An account was recently created for you on the PromoRama platform. Please find your login credentials below.<p>Email: ${email}<br>Password: ${password}</p></p><p>Kindly ensure you change your password to keep your account secure.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

/** Sends device change request email to the admin
 * @param {{employeeName: string, employeeEmail: string, reason: string}} data
 */
const sendDeviceChangeRequestEmail = (data) => {
  const { employeeName, employeeEmail, reason } = data;

  const transportObject = {
    email: 'info@thepromorama.com',
    subject: 'Device Change Request',
    htmlData: `<p>An employee has requested to link a new device.</p><p>Name: ${employeeName}<br>Email: ${employeeEmail}<br>Reason: ${reason}</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  sendEmail(transportObject).catch((err) =>
    logger.error(`[SendDeviceChangeRequestEmail]: ${err.message}`),
  );
};

/** Sends device change enabled email to a user
 * @param {{name: string, email: string}} data
 */
const sendDeviceChangeEnabledEmail = (data) => {
  const { name, email } = data;

  const transportObject = {
    email,
    subject: 'Device Change Enabled',
    htmlData: `<p>Hello ${name},</p><p>Your request to link a new device has been granted.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  sendEmail(transportObject).catch((err) =>
    logger.error(`[SendDeviceChangeRequestEmail]: ${err.message}`),
  );
};

/**
 * @param {{emails: string[], taskName: string, initiativeName: string}} data
 */
const sendTaskAssignedEmail = (data) => {
  const { emails, taskName, initiativeName } = data;

  const transportObject = {
    emails,
    subject: 'New Task',
    htmlData: `<p>Hello,</p><p>A new task '${taskName}' has been assigned to your store(s) for the '${initiativeName}' initiative.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  sendEmailToMultiple(transportObject).catch((err) =>
    logger.error(`[SendTaskAssignedEmail]: ${err.message}`),
  );
};

/**
 * @param {{taskName: string, initiativeName: string}} data
 */
const sendTaskCompletedEmail = ({ taskName, initiativeName }) => {
  const transportObject = {
    email: 'info@thepromorama.com',
    subject: 'Task Completed',
    htmlData: `<p>The task '${taskName}' for the initiative '${initiativeName}' has been completed in an initiative store.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  sendEmail(transportObject).catch((err) =>
    logger.error(`[SendTaskCompletedEmail]: ${err.message}`),
  );
};

/** Sends sign up invite email
 * @param {{email: string, role: string, inviteId: string, currentUser: any}} data
 */
const sendSignUpInviteEmail = (data) => {
  const { email, role, inviteId, currentUser } = data;

  let inviteLink = `${process.env.SIGN_UP_URL}?email=${email}&role=${role}&inviteId=${inviteId}`;

  if (currentUser.role === ROLE.AGENCY) inviteLink += `&agencyId=${currentUser.id}`;
  if (currentUser.role === ROLE.CLIENT) inviteLink += `&clientId=${currentUser.id}`;

  const transportObject = {
    email,
    subject: 'Invitation to join PromoRama',
    htmlData: `<p>Hello,</p><p>You have been invited to join the PromoRama platform as a ${role}. Click the link below to create an account.</p><p>${inviteLink}</p><p>This invitation will expire in 3 days.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

const sendClientInfoEmail = (data) => {
  const transportObject = {
    email: 'info@thepromorama.com',
    subject: 'Client Info',
    htmlData: `<p>Company name: ${data.companyName}<br>Company email: ${data.companyEmail}<br>Company phone number: ${data.companyPhoneNumber}<br>Company location: ${data.companyLocation}<br>Contact person name: ${data.contactPersonName}<br>Contact person email: ${data.contactPersonEmail}<br>Contact person phone number: ${data.contactPersonPhoneNumber}<br>Size of proposed users: ${data.proposedUsersSize}</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

const sendContactUsEmail = (data) => {
  const transportObject = {
    email: 'info@thepromorama.com',
    subject: 'Contact Support',
    htmlData: `<p>Name: ${data.name}<br>Email: ${data.email}</p><p>${data.message}</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  return sendEmail(transportObject);
};

const sendGameWinnerEmail = (data) => {
  const { name, email, prizeWon, storeName, initiativeName } = data;

  const transportObject = {
    email,
    subject: 'Prize Won Info',
    htmlData: `<p>Hello ${name},</p><p>You have won ${prizeWon} at ${storeName} courtesy of ${initiativeName}.</p><p>The team will connect with you on how to claim your prize.</p><p>Regards,<br>The PromoRama Team.</p>`,
  };

  sendEmail(transportObject).catch((err) => logger.error(`[SendGameWinnerEmail]: ${err.message}`));
};

const sendInitiativeWeeklyReportEmail = (data) => {
  const html = generateInitiativeWeeklyReportHtml(data);

  const transportObject = {
    emails: data.emails,
    subject: `${data.initiativeName} Initiative Weekly Report`,
    htmlData: html,
  };

  sendEmailToMultiple(transportObject).catch((err) =>
    logger.error(`[sendInitiativeWeeklyReportEmail]: ${err.message}`),
  );
};

const sendClientInitiativesMessagesReportEmail = (data) => {
  const { name, email, attachmentsData } = data;

  const attachments = attachmentsData.map((attachment) => {
    return {
      content: Buffer.from(attachment.excelBuffer).toString('base64'),
      filename: `${attachment.initiativeName}.xlsx`, // The name of the file to appear in the email
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // MIME type for .xlsx files
      disposition: 'attachment',
    };
  });

  const transportObject = {
    email,
    subject: 'Initiative(s) Messages Report',
    htmlData: `<p>Hello ${name} Team,</p><p>Please find the attached file(s) to download the latest messages report for your initiative(s) below.</p><p>Regards,<br>The PromoRama Team.</p>`,
    attachmentsData: attachments,
  };

  return sendEmail(transportObject);

  // const attachments = attachmentsData
  //   .map(
  //     (attachment) =>
  //       `<p>${attachment.initiativeName}: <a href="${attachment.fileUrl}">Click To Download</a></p>`,
  //   )
  //   .join('');

  // const transportObject = {
  //   email,
  //   subject: 'Message Center',
  //   htmlData: `<p>Hello ${name} Team,</p><p>Please find the link(s) to download the latest messages report for your initiative(s) below:</p>${attachments}<p>Regards,<br>The PromoRama Team.</p>`,
  // };
};

const sendInitiativeMessagesReportEmail = (data) => {
  const { emails, initiativeName, excelBuffer } = data;

  const html = generateInitiativeMessagesReportHtml(data);

  const attachment = {
    content: Buffer.from(excelBuffer).toString('base64'),
    filename: `${initiativeName}.xlsx`, // The name of the file to appear in the email
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // MIME type for .xlsx files
    disposition: 'attachment',
  };

  const transportObject = {
    emails,
    subject: `${initiativeName} Message/Issue Center Updates`,
    htmlData: html,
    attachmentsData: [attachment],
  };

  sendEmailToMultiple(transportObject).catch((err) =>
    logger.error(`[SendInitiativeMessagesReportEmail]: ${err.message}`),
  );

  // `<p>Hello ${name} Team,</p><p>Please find the attached file to download the latest messages report for your initiative below.</p><p>Regards,<br>The PromoRama Team.</p>`,
};

module.exports = {
  sendEmail,
  sendEmailToMultiple,
  sendEmailVerificationToken,
  sendPasswordResetTokenEmail,
  sendLoginCredentialsEmail,
  sendDeviceChangeRequestEmail,
  sendDeviceChangeEnabledEmail,
  sendTaskAssignedEmail,
  sendTaskCompletedEmail,
  sendSignUpInviteEmail,
  sendClientInfoEmail,
  sendContactUsEmail,
  sendGameWinnerEmail,
  sendInitiativeWeeklyReportEmail,
  sendClientInitiativesMessagesReportEmail,
  sendInitiativeMessagesReportEmail,
};
