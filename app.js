import {
  app,
  errorHandler
} from 'mu';
import {
  CronJob
} from 'cron';

const cronFrequency = process.env.EMAIL_CRON_PATTERN || '*/5 * * * *';
const nodemailer = require('nodemailer');

app.get('/', async function(req, res) {
  res.send('Hello from deliver-bbcdr-rapporten-service');
});

new CronJob(cronFrequency, function() {
  console.log(`Berichtcentrum email delivery triggered by cron job at ${new Date().toISOString()}`);
  // Check for emails into mailbox
}, null, true);

let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ADDRESS,
    pass: process.env.GMAIL_PASSWORD
  }
});

let mailOptions = {
  from: '"Claire Lovisa" <claire.lovisa@redpencil.io>',
  to: 'claire.lovisa@redpencil.io',
  subject: 'Hello ✔',
  text: 'Hello world?',
  html: '<b>Hello world?</b>',
  attachments: [
    {
      filename: 'hello.txt',
      content: 'Hello world !'
    }
  ]
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.log(error);
  }
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
});

app.use(errorHandler);
