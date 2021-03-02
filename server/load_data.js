const fs = require('fs')
const path = require('path')
const esConnection = require('./connection')

async function loadData() {
    try {
        await esConnection.checkConnection()
        await esConnection.resetIndex()
        // Read books directory
        let files = fs.readdirSync('./books').filter(file => file.slice(-4) === '.txt')
        console.log(`Found ${files.length} Files`)

        //Read each book file, and index each paragraph in elasticsearch
        for (let file of files) {
            console.log(`Reading File - ${file}`)
            const filePath = path.join('./books', file)
            const { title, author, paragraphs } = parseBookFile(filePath)
            await insertBookData(title, author, paragraphs)
        }
    } catch (err) {
        console.error(err)
    }
}

function parseBookFile(filePath) {
    const book = fs.readFileSync(filePath, 'utf8')

    const title = book.match(/^Title:\s(.+)$/m)[1]
    const authorMatch = book.match(/^Author:\s(.+)$/m)
    const author = (!authorMatch || authorMatch[1].trim() === '') ? 'Unknown Author' : authorMatch[1]
    console.log(`Reading Book - ${title} By ${author}`)
    const startOfBookMatch = book.match(/^\*{3}\s*START OF (THIS|THE) PROJECT GUTENBERG EBOOK.+\*{3}$/m)
    const startOfBookIndex = startOfBookMatch.index + startOfBookMatch[0].length
    const endOfBookIndex = book.match(/^\*{3}\s*END OF (THIS|THE) PROJECT GUTENBERG EBOOK.+\*{3}$/m).index

    const paragraphs = book.slice(startOfBookIndex, endOfBookIndex)
    .split(/\n\s+\n/g)
    .map(line => line.replace(/\r\n/g, ' ').trim())
    .map(line => line.replace(/_/g, ''))
    .filter((line) => (line && line !== ''))

    console.log(`Parsed ${paragraphs.length} Paragraphs\n`)
    return { title, author, paragraphs }

}

async function insertBookData(title, author, paragraphs) {
    let bulkOps = []

    for (let i = 0; i < paragraphs.length; i++) {
        bulkOps.push({
            index: {
                _index: esConnection.index,
            }
        })
        bulkOps.push({
            author,
            title,
            location: i,
            text: paragraphs[i]
        })

        if (i > 0 && i % 500 === 0) {
            await esConnection.client.bulk({
                body: bulkOps
            })
            bulkOps = []
            console.log(`Indexed Paragraphs ${i - 499} - ${i}`)
        }
    }
    await esConnection.client.bulk({ body: bulkOps })
    console.log(`Indexed Paragraphs ${paragraphs.length - (bulkOps.length / 2)} - ${paragraphs.length}\n\n\n`)

}



loadData()
// esConnection.resetIndex()
// console.log(esConnection)
// /** Clear ES index, parse and index all files from the books directory */
// async function readAndInsertBooks () {
//   try {
//     // Clear previous ES index
//     console.log("66666")
//     await esConnection.resetIndex(esConnection.index, esConnection.type)

    // Read books directory
    // let files = fs.readdirSync('./books').filter(file => file.slice(-4) === '.txt')
    // console.log(`Found ${files.length} Files`)

    // // Read each book file, and index each paragraph in elasticsearch
    // for (let file of files) {
    //   console.log(`Reading File - ${file}`)
    //   const filePath = path.join('./books', file)
    //   const { title, author, paragraphs } = parseBookFile(filePath)
    //   await insertBookData(title, author, paragraphs)
    // }
//   } catch (err) {
//     console.error(err)
//   }
// }

// readAndInsertBooks()