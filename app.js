require('dotenv').config();

const Koa = require('koa');
const Router = require('koa-router');
const socket = require('socket.io');
const path = require('path');
const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const moment = require('moment');

// init html page
const homeTemplate = ejs.compile(
  fs.readFileSync(path.join(__dirname, 'public/index.html')).toString()
);

// variables
const app = new Koa();
const router = new Router();

// make auth from auth string
function makeAuth(auth){
  const { ACCOUNT, PASSWORD } = process.env;
  if (ACCOUNT && PASSWORD && auth){
    try {
      const data = Buffer.from(auth.split(' ')[1] || '', 'base64').toString();
      const ps = data.split(':');
      const account = ps[0];
      const password = ps[1];

      if (account === ACCOUNT && password === PASSWORD){
        return true;
      }
    } catch(err){
      console.error(err);
      // do nothing
    }
  }

  return false;
}

// get today log filename
function getLogName(){
  return `log-${moment().format('YYYYMMDD')}.txt`;
}

function getLogPath(){
  const filepath = path.join(__dirname, `data/${getLogName()}`);
  if (!fs.existsSync(filepath)){
    fs.writeFileSync(filepath, '');
  }
  return filepath;
}

// compose, store and send message over socket
function makeMessage(agent, message){
  const d = new Date();
  const payload = JSON.stringify({
    createdAt: moment(d).format('YYYY/MM/DD HH:mm:ss'),
    timestamp: +d,
    agent: agent.toLowerCase(),
    message: message.trim()
  });

  const filepath = getLogPath();
  fs.appendFileSync(filepath, payload + '\n');

  io.to('admin').emit('message', payload);
}

// handle bot request
async function handleBot(ctx) {
  let { agent } = ctx.params;

  if (!agent)
    agent = ctx.query.agent;

  if (!agent)
    agent = 'anonymous';

  let { message, secret } = ctx.query;
  if (!secret)
    secret = ctx.request.headers['authorization'].trim();

  const { SECRET } = process.env;
  if (!SECRET || SECRET !== secret){
    ctx.body = 'not ok';
    ctx.status = 403;
    return;
  }

  io.to('admin').emit('message', makeMessage(agent, message));
  ctx.body = 'ok';
}

// routing
router.get('/emit', handleBot);
router.get('/emit/:agent', handleBot);

router.use(async (ctx, next) => {
  if (makeAuth(ctx.request.headers['authorization'])){
    await next();
    return;
  }

  ctx.set('WWW-Authenticate', 'Basic realm="Login to access admin panel"');
  ctx.status = 401;
});

router.get('/', ctx => {
  ctx.set('Content-Type', 'text/html');
  
  ctx.body = homeTemplate({
    log: fs.readFileSync(getLogPath())
  });
});

app.use(router.routes());

// socket
const server = http.createServer(app.callback());
const io = socket(server);

io.on('connection', function(socket){
  console.log('new connection');

  if (makeAuth(socket.handshake.headers['authorization'])){
    console.log('socket auth success');
    socket.join('admin');
    makeMessage('system', 'someone join our chat');   
  };

  socket.on('disconnect', function(){
    socket.leave('admin');
    makeMessage('system', 'someone leave our chat');   
    console.log('socket disconnect');
  });
});

// listen 
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server is running at port ${port}`));
