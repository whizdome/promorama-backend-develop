const { format } = require('date-fns');
const { TICKET_STATUS } = require('../constants');

const getTechSupportTicketTemplate = (info) => {
  const { status, fullName, ticketId } = info;

  const formattedDate = format(new Date(), 'MMMM d, yyyy, h:mm a');

  const openedTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Created</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #007bff;
            color: #fff;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h2>Support Ticket Created</h2>
    </div>

    <div class="content">
        <p>Dear ${fullName},</p>

        <p>Thank you for reaching out to our support team. We have received your request and a support ticket has been created for you. Our team will review your issue and get back to you as soon as possible.</p>

        <h3>Ticket Details:</h3>
        <ul>
            <li><strong>Ticket ID:</strong> ${ticketId}</li>
            <li><strong>Status:</strong> Open</li>
            <li><strong>Submitted On:</strong> ${formattedDate}</li>
        </ul>

        <p>You can track the progress of your ticket by logging into your account or by replying to this email. We are committed to resolving your issue promptly and will keep you updated with any progress.</p>

        <p>Thank you for your patience.</p>

        <p>Best Regards,</p>
        <p>Tech Support Team<br>Promorama</p>
    </div>

    <div class="footer">
        <p>Please do not hesitate to provide any additional information that may help us assist you better.</p>
    </div>
</div>

</body>
</html>
`;

  const inProgressTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket In Progress</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #ffc107;
            color: #fff;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h2>Support Ticket In Progress</h2>
    </div>

    <div class="content">
        <p>Dear ${fullName},</p>

        <p>We wanted to let you know that your support request with ticket ID <strong>${ticketId}</strong> is currently being worked on. Our team is actively investigating and addressing your issue.</p>

        <p>We appreciate your patience as we work to resolve your request. We will update you as soon as there is more information available or once the issue has been resolved.</p>

        <p>Thank you for your understanding.</p>

        <p>Best Regards,</p>
        <p>Tech Support Team<br>Promorama</p>
    </div>

    <div class="footer">
        <p>Please do not hesitate to reach out if you have any additional questions or concerns.</p>
    </div>
</div>

</body>
</html>
`;

  const rectifiedTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Rectified</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #28a745;
            color: #fff;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h2>Support Ticket Resolved</h2>
    </div>

    <div class="content">
        <p>Dear ${fullName},</p>

        <p>Good news! Your support request with ticket ID <strong>${ticketId}</strong> has been resolved. We believe the issue has been fully addressed, and your service should now be back to normal.</p>

        <p>If you have any further questions or if the issue persists, please feel free to reach out to us by replying to this email.</p>

        <p>Thank you for your patience and for choosing our support services.</p>

        <p>Best Regards,</p>
        <p>Tech SUpport Team<br>Promorama</p>
    </div>

    <div class="footer">
        <p>We appreciate your feedback. Please let us know if there is anything more we can assist you with.</p>
    </div>
</div>

</body>
</html>
`;

  const invalidClaimTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Marked as Invalid</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #dc3545;
            color: #fff;
            padding: 10px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            padding: 20px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777;
            text-align: center;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h2>Support Ticket Marked as Invalid</h2>
    </div>

    <div class="content">
        <p>Dear ${fullName},</p>

        <p>We regret to inform you that your support request with ticket ID <strong>${ticketId}</strong> has been marked as invalid. After reviewing your request, we found that it does not meet the criteria for a valid support issue.</p>

        <p>If you believe this is an error or if you have more information to provide, please feel free to reply to this email so we can further investigate your case.</p>

        <p>We apologize for any inconvenience this may cause and appreciate your understanding.</p>

        <p>Best Regards,</p>
        <p>Tech Support Team<br>Promorama</p>
    </div>

    <div class="footer">
        <p>We are here to help. Please let us know if you have any other questions or concerns.</p>
    </div>
</div>

</body>
</html>
`;

  if (status === TICKET_STATUS.OPEN) return openedTemplate;
  if (status === TICKET_STATUS.IN_PROGRESS) return inProgressTemplate;
  if (status === TICKET_STATUS.RECTIFIED) return rectifiedTemplate;
  if (status === TICKET_STATUS.INVALID) return invalidClaimTemplate;

  return null;
};

module.exports = { getTechSupportTicketTemplate };
