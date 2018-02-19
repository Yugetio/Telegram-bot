/* node-telegram-bot-api deprecated Automatic enabling of cancellation of promises isdeprecated.
In the future, you will have to enable it yourself.
See https://github.com/yagop/node-telegram-bot-api/issues/319. module.js:643:30 */
process.env["NTBA_FIX_319"] = 1; //for start

const TelegramBot = require('node-telegram-bot-api');
//Telegram token from @BotFather
const TOKEN = require('./token');
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

bot.on('message', msg => {
  const { id } = msg.chat;
  const { text } = msg;

  if (text.toLowerCase() == 'hello' || text.toLowerCase() == 'привет') {
    bot.sendMessage(id, `Hello, ${msg.chat.first_name}`);
  } else {
    bot.sendMessage(id, JSON.stringify(msg, null, 4));
  }
});