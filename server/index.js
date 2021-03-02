const Koa = require('koa');
const Router = require('koa-router')
const joi = require('joi')
const validate = require('koa-joi-validate')
const cors = require('@koa/cors');

const app = new Koa();
const router = new Router()
const search = require('./search')


app.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}`)
})

app.on('error', err => {
  console.error('Server Error', err)
})

app.use(cors());

router.get('/search', async (ctx, next) => {
  validate({
    query: {
      term: joi.string().max(60).required(),
      offset: joi.number().integer().min(0).default(0)
    }
  })
  const {term, offset} = ctx.request.query
  ctx.body = await search.queryTerm(term, offset)
})

const port = process.env.PORT || 3000

app.use(router.routes()).use(router.allowedMethods()).listen(port, err => {
  if (err) throw err
  console.log(`App listening on Port ${port}`)
})