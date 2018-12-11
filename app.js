import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import {
  fetchEmailsToBeSent,
  setEmailToSentBox
} from './support';
import request from 'request';

const cronFrequency = process.env.EMAIL_CRON_PATTERN || '*/5 * * * *';
const nodemailer = require('nodemailer');

app.get('/', async function(req, res) {
  res.send('Hello from deliver-bbcdr-rapporten-service');
});

new CronJob(cronFrequency, function() {
  console.log(`Berichtcentrum email delivery triggered by cron job at ${new Date().toISOString()}`);
  request.patch('http://localhost/berichtencentrum-email-delivery/');
}, null, true);

app.patch('/berichtencentrum-email-delivery/', async function( req, res, next ) {
  try {
    const emails = await fetchEmailsToBeSent();
    if (emails.length == 0) {
      console.log(`No emails found that need to be sent`);
      return res.status(204).end();
    }
    console.log(`Found ${emails.length} emails to send`);

    Promise.all(emails.map( async (email) => {
      console.log(`Start sending email ${email.messageId}`);

      try {
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_ADDRESS,
            pass: process.env.GMAIL_PASSWORD
          }
        });

        let mailOptions = {
          from: email.messageFrom,
          to: email.emailTo,
          cc: email.emailCc,
          subject: email.messageSubject,
          text: email.plainTextMessageContent,
          html: email.htmlMessageContent,
          // Add attachments handling
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);
        });

        setEmailToSentBox(email.messageId);
        console.log('Message moved to sentbox: %s', info.messageId);
      } catch(err) {
        console.log(`Failed to send email ${email.id}: ${err}`);
      }
    }));
  }
  catch(e) {
    return next(new Error(e.message));
  }
});

app.use(errorHandler);
