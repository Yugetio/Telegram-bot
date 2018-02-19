/* node-telegram-bot-api deprecated Automatic enabling of cancellation of promises isdeprecated.
In the future, you will have to enable it yourself.
See https://github.com/yagop/node-telegram-bot-api/issues/319. module.js:643:30 */
process.env["NTBA_FIX_319"] = 1; //for start

const TelegramBot = require('node-telegram-bot-api');
//Telegram token from @BotFather
const token = require('./token');
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

bot.on('message', (msg) => {
  console.log(msg);
  bot.sendMessage(msg.chat.id, 'Привет ' + msg.chat['first_name']);
});