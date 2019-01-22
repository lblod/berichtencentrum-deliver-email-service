# berichtencentrum-deliver-email-service

Microservice that delivers emails from a mail folder

## Installation

### Docker-compose snippet

To add the service to your stack, add the following snippet to docker-compose.yml:

```
services:
  berichtencentrum-deliver-email-service:
    image: lblod/berichtencentrum-deliver-email-service
    environment:
      WELL_KNOWN_SERVICE_OR_SERVER: "..."
      [...]
```

### Environment variables

#### System configuration

```
EMAIL_CRON_PATTERN: optional, default '*/1 * * * * *'
HOURS_DELIVERING_TIMEOUT: optional, default '1'
GRAPH_NAME: optional, 'http://graph/url', default 'http://mu.semte.ch/graphs/system/email'
```

#### Protocole choice
```
  SMTP_OR_REST : 'smtp' or 'rest'
```

#### SMTP

```
  WELL_KNOWN_SERVICE_OR_SERVER: required, service from list https://nodemailer.com/smtp/well-known/ or 'server'
  HOST: required if GMAIL_OR_SERVER=='server', 'hostName'
  PORT: required if GMAIL_OR_SERVER=='server', 80
  SECURE_CONNECTION: optional if GMAIL_OR_SERVER=='server', 'true' or 'false', default 'false'
  EMAIL_ADDRESS: required, 'aGmailAddress'
  EMAIL_PASSWORD: required, 'theCorrespondingPassword'
```

#### REST



#### Email configuration
```
FROM_NAME: optional, 'name' to put before the sender email address
```

### Development

```
services:
  berichtencentrum-deliver-email-service:
    image: lblod/berichtencentrum-deliver-email-service
    ports:
      - "8888:80"
      - "9229:9229"
    environment:
      NODE_ENV: "development"
      GMAIL_OR_SERVER: "..."
      [...]
    links:
      - database:database
    volumes:
      - /path/to/your/code/:/app/
```
