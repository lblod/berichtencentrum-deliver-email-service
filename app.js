import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  fetchEmailsToBeSent,
  setEmailToMailbox,
  updateEmailId
} from './support';
import request from 'request';

const fromName = process.env.FROM_NAME || '';
const cronFrequency = process.env.EMAIL_CRON_PATTERN || '*/1 * * * *';
const nodemailer = require('nodemailer');
const graphName = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';

app.get('/', async function(req, res) {
  res.send('Hello from deliver-bbcdr-rapporten-service');
});

new CronJob(cronFrequency, function() {
  console.log(`Berichtcentrum email delivery triggered by cron job at ${new Date().toISOString()}`);
  request.patch('http://localhost/berichtencentrum-email-delivery/');
}, null, true);

app.patch('/berichtencentrum-email-delivery/', async function(req, res, next) {
  try {
    const emails = await fetchEmailsToBeSent(graphName);
    if (emails.length == 0) {
      console.log(`No emails found that need to be sent`);
      return res.status(204).end();
    }
    console.log(`Found ${emails.length} emails to send`);

    Promise.all(emails.map(async (email) => {
      console.log(`Start sending email ${email.uuid}`);

      try {
        await setEmailToMailbox(graphName, email.uuid, "sending");
        console.log(`Message moved to sending: ${email.uuid}`);

        const smtpOrRest = process.env.SMTP_OR_REST;
        if (smtpOrRest == 'smtp') {
          await processEmailSmtp(email);
        } else if (smtpOrRest == 'rest') {
          //TODO
        } else {
          return console.log(`SMTP_OR_REST should be 'smtp' or 'rest'`);
        }
      } catch (err) {
        console.log(`Failed to process email sending for email ${email.uuid}: ${err}`);
        await setEmailToMailbox(graphName, email.uuid, "outbox");
        console.log(`Message moved back to outbox: ${email.uuid}`);
      }
    }));
  } catch (e) {
    return next(new Error(e.message));
  }
});

const processEmailSmtp = async function(email) {
  const gmailOrServer = process.env.GMAIL_OR_SERVER;
  if (gmailOrServer != ('gmail' || 'server')) {
    return console.log(`GMAIL_OR_SERVER should be 'gmail' or 'port'`);
  } else {
    let transporter = null;
    if (gmailOrServer == 'gmail') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      transporter = nodemailer.createTransport(smtpTransport({
        host: process.env.HOST,
        port: process.env.PORT,
        secureConnection: process.env.SECURE_CONNECTION || false,
        auth: {
          user: process.env.EMAIL_ADDRESS,
          pass: process.env.EMAIL_PASSWORD
        }
      }));
    };

    let attachments = null;
    if (email.attachments) {
      attachments = email.attachments.map((attachment) => {
        return {
          filename: attachment.filename,
          path: attachment.dataSource
        };
      });
    } else {
      attachments = [];
    }

    const mailOptions = {
      from: `${fromName} ${email.from}`,
      to: email.emailTo,
      cc: email.emailCc,
      subject: email.messageSubject,
      text: email.plainTextMessageContent,
      html: email.htmlMessageContent,
      attachments: attachments
    };

    transporter.sendMail(mailOptions, async (error, info) => {
      if (error) {
        console.log(`An error has occured while sending message ${email.uuid} : ${error}`);
        await setEmailToMailbox(graphName, email.uuid, "outbox");
        console.log(`Message moved back to outbox: ${email.uuid}`);
      } else {
        console.log(`Message sent: %s`, email.uuid);
        await setEmailToMailbox(graphName, email.uuid, "sentbox");
        console.log(`Message moved to sentbox: ${email.uuid}`);
        await updateEmailId(graphName, email.messageId, info.messageId);
        console.log(`MessageId updated from ${email.messageId} to ${info.messageId}`);
        email.messageId = info.messageId;
      }
    });
  }
};

app.use(errorHandler);
