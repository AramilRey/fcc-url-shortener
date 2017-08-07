require('dotenv').config();

const Koa = require('koa');
const Url = require('./models/url');

const path = require('path');
const views = require('koa-views');
const koaBody = require('koa-body');
const router = require('koa-router')();
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const app = new Koa();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      message: err.message || 'Oh, noes!',
      code: err.code || 4000
    };
    ctx.app.emit('error', err, ctx);
  }
});

app.use(koaBody());
app.use(views(path.join(__dirname, '/views'), { extension: 'html' }));

// Go home
router.get('/', async ctx => await ctx.render('home'));

// Go to :shortUrl expanded or fail
router.get('/:shortUrl', async ctx => {
  try {
    const redirectUrl = await Url.expand(ctx.params.shortUrl);
    ctx.redirect(redirectUrl);
  }
  catch (error) {
    ctx.throw(422, error);
  }
});

// Shrink POSTed url or fail
router.post('/', async ctx => {
  try {
    ctx.body = {
      shortUrl: await Url.shrink(ctx.request.body.url)
    }
  }
  catch (error) {
    ctx.throw(422, error);
  }
});

app.use(router.routes());

app.use(async function pageNotFound(ctx) {
  ctx.status = 404;

  switch (ctx.accepts('html', 'json')) {
    case 'html':
      ctx.type = 'html';
      ctx.body = '<p>Page Not Found</p>';
      break;
    case 'json':
      ctx.body = {
        message: 'Page Not Found'
      };
      break;
    default:
      ctx.type = 'text';
      ctx.body = 'Page Not Found';
  }
});

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;
mongoose.connect(`mongodb://${dbUser}:${dbPass}@ds135983.mlab.com:35983/urlshortener`).then(() => console.log('connected to DB'));

app.listen(3000, () => console.log('app initialized'));
