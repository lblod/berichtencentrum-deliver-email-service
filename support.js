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

    SELECT ?email
      ?messageId
      ?messageFrom
      ?messageSubject
      ?plainTextMessageContent
      ?htmlMessageContent
      (group_concat(distinct ?emailTo;separator=",") as ?emailTo)
      (group_concat(distinct ?emailCc;separator=",") as ?emailCc)
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
        ?email nmo:emailTo ?emailTo.
        ?email nmo:emailCc ?emailCc.
      }
    }
    GROUP BY ?email ?messageId ?messageFrom ?messageSubject ?plainTextMessageContent ?htmlMessageContent
  `);
  return parseResult(result);
};

const setEmailToSentBox = async function(id) {
  const result = await query(`
    // The query
`);
  return parseResult(result);
};

export { fetchEmailsToBeSent, setEmailToSentBox };
