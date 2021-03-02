const {
    Client
} = require('@elastic/elasticsearch')
const host = process.env.ES_HOST || 'localhost'
const client = new Client({
    node: `http://${host}:9200`
})
const index = 'library'
const type = 'novel'

async function checkConnection() {
    try {
        let health = await client.cluster.health({})
        console.log(health)
    } catch (err) {
        console.log("Failed", err);
    }

}

async function resetIndex() {
    let exists = await client.indices.exists({
        index
    })
    console.log(exists.statusCode);
    if (exists.statusCode === 200) {
        console.log("going to delete it")
        await client.indices.delete({
            index
        })
        console.log("Deleted");
    }

    console.log("Going to create new")

    await client.indices.create({
        index
    })
    console.log("Going to put mapping")
    await putBookMapping()
}

async function putBookMapping() {
    const schema = {
        title: {
            type: 'keyword'
        },
        author: {
            type: 'keyword'
        },
        location: {
            type: 'integer'
        },
        text: {
            type: 'text'
        }
    }

    return client.indices.putMapping({
        index,
        body: {
            properties: schema
        }
    })
}

module.exports = {
    client,
    index,
    checkConnection,
    resetIndex
}