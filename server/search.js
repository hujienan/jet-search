const { client, index} = require('./connection')

module.exports = {
  /** Query ES index for the provided term */
  queryTerm (term, offset = 0) {
    const body = {
        from: offset,
        query: {
            match: {
                text: term
            }
        }
    }

    return client.search({ index, body })
  }
}