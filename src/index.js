process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard');
const kb = require('./keyboard-btn');

const bot = new TelegramBot(config.TOKEN, {
  polling: true
});

mongoose.connect(config.DB_URL, {
    useMongoClient: true
  })
  .then(() => console.log('MondoDB connected'))
  .catch((err) => console.log(err));

helper.logStart();


bot.onText(/\/start/, msg => {
  const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы`;
  bot.sendMessage(helper.getChatId(msg), text, {
    reply_markup: {
      keyboard: keyboard.home
    }
  });
});

bot.on('message', msg => {
  const chatID = helper.getChatId(msg);

  switch (msg.text) {
    case kb.home.favourite:
      ;
      break;
    case kb.home.films:
      bot.sendMessage(chatID, 'Выберите жанр:', {
        reply_markup: { keyboard: keyboard.films }
      });
      break;
    case kb.home.cinemas:
      ;
      break;
    case kb.back:
      bot.sendMessage(chatID, 'Что хотите посмотреть?', {
        reply_markup: { keyboard: keyboard.home }
      });
      break;
  }
});