import { app, query, sparqlEscapeString, sparqlEscapeUrl } from 'mu';

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
const fetchEmailsToBeSent = async function(graphName) {
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
    WHERE {
      GRAPH ${sparqlEscapeUrl(graphName)} {
        <http://data.lblod.info/id/mailboxes/1> fni:hasPart ?mailfolder.
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
      }
    }
    GROUP BY ?email ?uuid ?messageSubject ?messageFrom ?messageId ?plainTextMessageContent ?htmlMessageContent
  `);
  return parseResult(result);
};

const setEmailToMailbox = async function(graphName, mailId, mailboxName) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>
    PREFIX nfo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#>

    DELETE {
       GRAPH ${sparqlEscapeUrl(graphName)} {
            ?email nmo:isPartOf ?folder.
        }
     }
    WHERE {
      GRAPH ${sparqlEscapeUrl(graphName)} {
            ?email a nmo:Email.
            ?email <http://mu.semte.ch/vocabularies/core/uuid> ${sparqlEscapeString(emailId)}.
            ?email nmo:isPartOf ?folder.
        }
    }
    ;
    INSERT {
       GRAPH ${sparqlEscapeUrl(graphName)} {
           ?email nmo:isPartOf ?mailfolder.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUrl(graphName)} {
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
       GRAPH ${sparqlEscapeUrl(graphName)} {
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
     }
    INSERT {
       GRAPH ${sparqlEscapeUrl(graphName)} {
           ?email nmo:messageId ${sparqlEscapeString(newMessageId)}.
        }
    }
    WHERE {
      GRAPH ${sparqlEscapeUrl(graphName)} {
            ?email a nmo:Email.
            ?email nmo:messageId ${sparqlEscapeString(oldMessageId)}.
        }
    }
`);
};

export {
  fetchEmailsToBeSent,
  setEmailToMailbox,
  updateEmailId
};
