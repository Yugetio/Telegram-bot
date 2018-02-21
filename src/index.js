process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const geolib = require('geolib');
const _ = require('lodash');
const config = require('./config');
const helper = require('./helper');
const keyboard = require('./keyboard');
const kb = require('./keyboard-btn');
// const database = require('../database.json');

helper.logStart();

//=============data base=================
mongoose.Promise = global.Promise;
mongoose.connect(config.DB_URL, {
    // useMongoClient: true
  })
  .then(() => console.log('MondoDB connected'))
  .catch((err) => console.log(err));

require('./model/film.model');
require('./model/cinema.model');
require('./model/user.model');

const Film = mongoose.model('films');
const Cinema = mongoose.model('cinemas');
const User = mongoose.model('users');
// database.films.forEach(f => new Film(f).save().catch(e => console.log(e))); //заполняем базу данных массивом фильмов
// database.cinemas.forEach(c => new Cinema(c).save().catch(e => console.log(e))); //заполняем базу данных массивом кинотеатров
//cd /usr/bin/ -> mongo -> show databases -> use ycinema -> db.cinemas.find({})

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
    //main block
    case kb.home.favourite:
      ;
      break;
    case kb.home.films:
      bot.sendMessage(chatID, 'Выберите жанр:', {
        reply_markup: { keyboard: keyboard.films }
      });
      break;
    case kb.home.cinemas:
      bot.sendMessage(chatID, 'Отправить местоположение', {
        reply_markup: {
          keyboard: keyboard.cinemas
        }
      });
      break;
    case kb.back:
      bot.sendMessage(chatID, 'Что хотите посмотреть?', {
        reply_markup: { keyboard: keyboard.home }
      });
      break;
      //film block
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

  if (msg.location) {
    getCinemasCoord(chatID, msg.location);
  }
});

bot.onText(/\/f(.+)/, (msg, [source, match]) => {
  const filmUuid = helper.getItemUuid(source);
  const chatId = msg.chat.id;

  Film.findOne({ uuid: filmUuid }).then(film => {
    const caption = `Название: ${film.name}\nГод: ${film.year}\nРейтинг: ${film.rate}\nДлительность: ${film.length}\nСтрана: ${film.country}`;

    bot.sendPhoto(chatId, film.picture, {
      caption: caption,
      reply_markup: {
        inline_keyboard: [
          [{
            text: 'Добавить в избранное',
            callback_data: film.uuid
          }, {
            text: 'Показать кинотеатры',
            callback_data: film.uuid
          }],
          [{
            text: `Кинопоиск ${film.name}`,
            url: film.link
          }]
        ]
      }
    })
  });
});

bot.onText(/\/c(.+)/, (msg, [source, match]) => {
  const cinemaUuid = helper.getItemUuid(source);
  const chatId = helper.getChatId(msg);

  Cinema.findOne({ uuid: cinemaUuid }).then(cinema => {
    bot.sendMessage(chatId, `Кинотеатр ${cinema.name}`, {
      reply_markup: {
        inline_keyboard: [
          [{
            text: cinema.name,
            url: cinema.url
          }, {
            text: 'Показать на карте',
            callback_data: cinema.uuid
          }],
          [{
            text: 'Показать фильмы',
            callback_data: JSON.stringify(cinema.films)
          }]
        ]
      }
    });
  });
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

//================================================
function getCinemasCoord(chatId, location) {
  Cinema.find({}).then(cinemas => {

    cinemas.forEach(c => {
      c.distance = geolib.getDistance(location, c.location) / 1000; //получаем километры
    });

    cinemas = _.sortBy(cinemas, 'distance'); //сотрировка по расстоянию

    const html = cinemas.map((c, i) => {
      return `<b>${i+1}</b> ${c.name}. <em>Расстояние</em> - <strong>${c.distance}</strong> км. /c${c.uuid}`
    }).join('\n');;
    sendHTML(chatId, html, 'cinemas');
  });
}