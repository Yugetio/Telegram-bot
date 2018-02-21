process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard');
const kb = require('./keyboard-btn');
const database = require('../database.json');

helper.logStart();

//=============data base=================
mongoose.Promise = global.Promise;
mongoose.connect(config.DB_URL, {
    // useMongoClient: true
  })
  .then(() => console.log('MondoDB connected'))
  .catch((err) => console.log(err));

require('./model/film.model');
const Film = mongoose.model('films');
// database.films.forEach(f => new Film(f).save()); //заполняем базу данных массивом фильмов

//===========================================
const bot = new TelegramBot(config.TOKEN, {
  polling: true
});

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
    case kb.film.comedy:
      sendFilmsByQuery(chatID, { type: 'comedy' });
      break;
    case kb.film.ection:
      sendFilmsByQuery(chatID, { type: 'action' });
      break;
    case kb.film.random:
      sendFilmsByQuery(chatID, {});
      break;
  }
});


//========get date from databases================
function sendFilmsByQuery(chatId, query) {
  Film.find(query).then(films => {
    const html = films.map((f, i) => `<b>${i+1}</b> ${f.name} - /f${f.uuid}`).join('\n');

    sendHTML(chatId, html, 'films');
  });
}
//===============================================

function sendHTML(chatId, html, keyboardName = null) {
  const options = {
    parse_mode: 'HTML'
  };
  if (keyboardName) {
    options['reply_markup'] = {
      keyboard: keyboard[keyboardName]
    }
  }
  bot.sendMessage(chatId, html, options);
}