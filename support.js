/**
 * Retrieve emails wating to be sent
 * @method fetchEmailsToBeSent
 * @return {Array}
 */
const fetchEmailsToBeSent = async function() {
  const result = await query(`
    // The query
`);
  return parseResult(result);
};

const setEmailToSentBox = async function(id) {
  const result = await query(`
    // The query
`);
  return parseResult(result);
};
