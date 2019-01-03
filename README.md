# berichtencentrum-deliver-email-service
Microservice that delivers messages as emails

## Installation

### Docker-compose snippet

To add the service to your stack, add the following snippet to docker-compose.yml:

```
services:
  berichtencentrum-deliver-email-service:
    image: lblod/berichtencentrum-deliver-email-service
    environment:
      GMAIL_OR_SERVER: "..."
      [...]
```

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
