import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  fetchEmailsToBeSent,
  createSentDate,
  setEmailToMailbox,
  updateEmailId,
  wellKnownServices
} from './support';
import request from 'request';

const fromName = process.env.FROM_NAME || '';
const cronFrequency = process.env.EMAIL_CRON_PATTERN || '*/1 * * * *';
const hoursDeliveringTimeout = process.env.HOURS_DELIVERING_TIMEOUT || 1;
const nodemailer = require('nodemailer');
const graphName = process.env.GRAPH_NAME || 'http://mu.semte.ch/graphs/system/email';
const mailfolderUri = process.env.MAILFOLDER_URI || 'http://data.lblod.info/id/mailboxes/1';
const nodemailerServices = wellKnownServices();

app.get('/', async function(req, res) {
  res.send('Hello from deliver-bbcdr-rapporten-service');
});

new CronJob(cronFrequency, function() {
  console.log(`Berichtcentrum email delivery triggered by cron job at ${new Date().toISOString()}`);
  request.patch('http://localhost/berichtencentrum-email-delivery/');
}, null, true);

app.patch('/berichtencentrum-email-delivery/', async function(req, res, next) {
  try {
    const emails = await fetchEmailsToBeSent(graphName, mailfolderUri);
    if (emails.length == 0) {
      console.log(`No emails found that need to be sent`);
      return res.status(204).end();
    }
    console.log(`Found ${emails.length} emails to send`);

    for (const email of emails) {
      console.log(`Start sending email ${email.uuid}`);
      try {
        await setEmailToMailbox(graphName, email.uuid, "sending");
        console.log(`Message moved to sending: ${email.uuid}`);

        const smtpOrRest = process.env.SMTP_OR_REST;

        if(!email.sentDate) {
          await createSentDate(graphName, email);
        }

        if (filterDeliveringTimeout(email)) {
          if (smtpOrRest == 'smtp') {
            await processEmailSmtp(email);
          } else if (smtpOrRest == 'rest') {
            // TODO when needed
            console.log(`Sending emails via 'rest' is not supported at the moment.`);
          } else {
            console.log(`SMTP_OR_REST should be 'smtp' or 'rest'`);
          }
        } else {
          await setEmailToMailbox(graphName, email.uuid, "failbox");
          console.log(`Timeout reached, message moved to failbox: ${email.uuid}`);
        }
      } catch (e) {
        console.log(`An error has occured while processing the email ${email.uuid}: ${e}`);
        await setEmailToMailbox(graphName, email.uuid, "outbox");
        console.log(`Message moved back to outbox: ${email.uuid}`);
        if (e.responseCode && error.responseCode == 452) { // 452 = Too many emails sent or too many recipients
          console.log("The server is saturated, clearing the email queue until next round.")
          break;
        }
      }
    }
  } catch (e) {
    return next(new Error(e.message));
  }
});

const processEmailSmtp = async function(email) {
  const wellKnownServiceOrServer = process.env.WELL_KNOWN_SERVICE_OR_SERVER;
  if (!((nodemailerServices.indexOf(wellKnownServiceOrServer) > (-1)) || (nodemailerServices == 'server'))) {
    return console.log(`WELL_KNOWN_SERVICE_OR_SERVER should be 'server' or a known service by Nodemailer`);
  } else {
    let transporter = null;
    if (wellKnownServiceOrServer != 'server') {
      transporter = nodemailer.createTransport({
        service: wellKnownServiceOrServer,
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

    const attachments = (email.attachments || []).map((attachment) => {
      return { filename: attachment.filename, path: attachment.dataSource };
    });

    const mailOptions = {
      from: `${fromName} ${email.messageFrom}`,
      to: email.emailTo,
      cc: email.emailCc,
      subject: email.messageSubject,
      text: email.plainTextMessageContent,
      html: email.htmlMessageContent,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent: %s`, email.uuid);
    await setEmailToMailbox(graphName, email.uuid, "sentbox");
    console.log(`Message moved to sentbox: ${email.uuid}`);
    await updateEmailId(graphName, email.messageId, info.messageId);
    console.log(`MessageId updated from ${email.messageId} to ${info.messageId}`);
    email.messageId = info.messageId;
  }
};

const filterDeliveringTimeout = function( email ) {
  let modifiedDate = new Date(email.sentDate);
  let currentDate = new Date();
  return ((currentDate - modifiedDate) / (1000 * 60 * 60)) <= parseInt(hoursDeliveringTimeout);
};

app.use(errorHandler);
