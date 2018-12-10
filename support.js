import { app, query, sparqlEscapeString } from 'mu';

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
const fetchEmailsToBeSent = async function() {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    SELECT ?email ?messageId ?messageFrom ?messageSubject ?plainTextMessageContent ?htmlMessageContent
    WHERE {
      GRAPH <http://mu.semte.ch/graphs/public> {
        <http://data.lblod.info/id/mailboxes/1> fni:hasPart ?mailfolder.
        ?mailfolder nie:title "outbox".
        ?email nmo:isPartOf ?mailfolder.
        ?email nmo:messageId ?messageId.
        ?email nmo:messageFrom ?messageFrom.
        ?email nmo:messageSubject ?messageSubject.
        ?email nmo:plainTextMessageContent ?plainTextMessageContent.
        ?email nmo:htmlMessageContent ?htmlMessageContent.
      }
    }
  `);
  return parseResult(result);
};

/**
 * Retrieve email receivers for "To" property
 * @method fetchEmailReceiversTo
 * @return {Array}
 */
const fetchEmailRecipientsTo = async function(emailId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    SELECT ?emailTo
    WHERE {
      GRAPH <http://mu.semte.ch/graphs/public> {
        ?email a nmo:Email.
        ?email nmo:messageId ${sparqlEscapeString(emailId)}.
        ?email nmo:emailTo ?emailTo.
      }
    }
  `);
  return parseResult(result);
};

/**
 * Retrieve email receivers for "Cc" property
 * @method fetchEmailReceiversTo
 * @return {Array}
 */
const fetchEmailRecipientsCc = async function(emailId) {
  const result = await query(`
    PREFIX nmo: <http://www.semanticdesktop.org/ontologies/2007/03/22/nmo#>
    PREFIX fni: <http://www.semanticdesktop.org/ontologies/2007/03/22/fni#>
    PREFIX nie: <http://www.semanticdesktop.org/ontologies/2007/03/22/nie#>

    SELECT ?emailCc
    WHERE {
      GRAPH <http://mu.semte.ch/graphs/public> {
        ?email a nmo:Email.
        ?email nmo:messageId ${sparqlEscapeString(emailId)}.
        ?email nmo:emailCc ?emailCc.
      }
    }
  `);
  return parseResult(result);
};

const setEmailToSentBox = async function(id) {
  const result = await query(`
    // The query
`);
  return parseResult(result);
};

export { fetchEmailsToBeSent, fetchEmailRecipientsTo, fetchEmailRecipientsCc, setEmailToSentBox };
