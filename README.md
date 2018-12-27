# berichtencentrum-deliver-email-service
Microservice that delivers messages as emails

### Environment variables
```
  GMAIL_OR_SERVER: required, 'gmail' or 'server'
  HOST: required if GMAIL_OR_SERVER=='server', 'hostName'
  PORT: required if GMAIL_OR_SERVER=='server', 80
  SECURE_CONNECTION: optional if GMAIL_OR_SERVER=='server', 'true' or 'false', default 'false'
  EMAIL_ADDRESS: required, 'aGmailAddress'
  EMAIL_PASSWORD: required, 'theCorrespondingPassword'
  FROM_NAME: optional, 'name' to put before the sender email address

  EMAIL_CRON_PATTERN: optional, default '*/5 * * * * *'
```
