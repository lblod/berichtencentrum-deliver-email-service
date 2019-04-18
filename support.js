import { app, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { querySudo as query } from '@lblod/mu-auth-sudo';

/**
 * Convert results of select query to an array of objects.
 * @method parseResult
 * @return {Array}
 */
const parseResult = function(result) {
  const bindingKeys = result.head.vars;
  return result.results.bindings.map((row) => {
    const obj = {};
    bindingKeys.forEach((key) => obj[key] = row[key].value);
    return obj;
  });
};

/**
 * Retrieve emails wating to be sent
 * @method fetchEmailsToBeSent
 * @return {Array}
 */
const fetchEmailsToBeSent = async function(graphName, mailfolderUri) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    SELECT ?email
      ?uuid
      ?messageSubject
      ?messageFrom
      (group_concat(distinct ?emailTo;separator=",") as ?emailTo)
      (group_concat(distinct ?emailCc;separator=",") as ?emailCc)
      ?messageId
      ?plainTextMessageContent
      ?htmlMessageContent
      ?sentDate
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
        ${sparqlEscapeUri(mailfolderUri)} fni:hasPart ?mailfolder.
        ?mailfolder nie:title "outbox".
        ?email nmo:isPartOf ?mailfolder.
        ?email <http://mu.semte.ch/vocabularies/core/uuid> ?uuid.
        ?email nmo:messageSubject ?messageSubject.
        ?email nmo:messageFrom ?messageFrom.
        ?email nmo:emailTo ?emailTo.

        BIND('' as ?defaultEmailCc).
        OPTIONAL {?email nmo:emailCc ?optionalEmailCc}.
        BIND(coalesce(?optionalEmailCc, ?defaultEmailCc) as ?emailCc).

        BIND('' as ?defaultmessageId).
        OPTIONAL {?email nmo:messageId ?optionalMessageId}.
        BIND(coalesce(?optionalMessageId, ?defaultmessageId) as ?messageId).

        BIND('' as ?defaultPlainTextMessageContent).
        OPTIONAL {?email nmo:plainTextMessageContent ?optionalPlainTextMessageContent}.
        BIND(coalesce(?optionalPlainTextMessageContent, ?defaultPlainTextMessageContent) as ?plainTextMessageContent).

        BIND('' as ?defaultHtmlMessageContent).
        OPTIONAL {?email nmo:htmlMessageContent ?optionalHtmlMessageContent}.
        BIND(coalesce(?optionalHtmlMessageContent, ?defaultHtmlMessageContent) as ?htmlMessageContent).

        BIND('' as ?defaultSentDate).
        OPTIONAL {?email nmo:sentDate ?optionalSentDate}.
        BIND(coalesce(?optionalSentDate, ?defaultSentDate) as ?sentDate).
      }
    }
    GROUP BY ?email ?uuid ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent ?sentDate
  `);
  return parseResult(result);
};

const createSentDate = async function(graphName, email) {
  const sentDate = new Date().toISOString();
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    INSERT {
       GRAPH ${sparqlEscapeUri(graphName)} {
           ?email nmo:sentDate "${sentDate}".
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email a nmo:Email.
            ?email <http://mu.semte.ch/vocabularies/core/uuid> "${email.uuid}".
        }
    }
  `);
  email.sentDate = sentDate;
}

const setEmailToMailbox = async function(graphName, emailId, mailboxName) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
    PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

    DELETE {
       GRAPH ${sparqlEscapeUri(graphName)} {
            ?email nmo:isPartOf ?folder.
        }
     }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email a nmo:Email.
            ?email <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(emailId)}.
            ?email nmo:isPartOf ?folder.
        }
    }
    ;
    INSERT {
       GRAPH ${sparqlEscapeUri(graphName)} {
           ?email nmo:isPartOf ?mailfolder.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?mailfolder a nfo:Folder.
            ?mailfolder nie:title  ${sparqlEscapeString(mailboxName)}.
            ?email a nmo:Email.
            ?email <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(emailId)}.
        }
    }
`);
};

const updateEmailId = async function(graphName, oldMessageId, newMessageId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    DELETE {
       GRAPH ${sparqlEscapeUri(graphName)} {
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
     }
    INSERT {
       GRAPH ${sparqlEscapeUri(graphName)} {
           ?email nmo:messageId ${sparqlEscapeString(newMessageId)}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUri(graphName)} {
            ?email a nmo:Email.
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
    }
`);
};

const wellKnownServices = function() {
  return [
    '126',
    '163',
    '1und1',
    'AOL',
    'DebugMail',
    'DynectEmail',
    'FastMail',
    'GandiMail',
    'Gmail',
    'Godaddy',
    'GodaddyAsia',
    'GodaddyEurope',
    'hot.ee',
    'Hotmail',
    'iCloud',
    'mail.ee',
    'Mail.ru',
    'Maildev',
    'Mailgun',
    'Mailjet',
    'Mailosaur',
    'Mandrill',
    'Naver',
    'OpenMailBox',
    'Outlook365',
    'Postmark',
    'QQ',
    'QQex',
    'SendCloud',
    'SendGrid',
    'SendinBlue',
    'SendPulse',
    'SES',
    'SES-US-EAST-1',
    'SES-US-WEST-2',
    'SES-EU-WEST-1',
    'Sparkpost',
    'Yahoo',
    'Yandex',
    'Zoho',
    'qiye.aliyun'
  ];
};

export {
  fetchEmailsToBeSent,
  createSentDate,
  setEmailToMailbox,
  updateEmailId,
  wellKnownServices
};
