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

const ACTION_TYPE = {
  TOGGLE_FAV_FILM: 'tff',
  SHOW_CINEMAS: 'sc',
  SHOW_CINEMAS_MAP: 'scm',
  SHOW_FILMS: 'sf'
};

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
      showFavouriteFilms(chatID, msg.from.id);
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
  const chatId = helper.getChatId(msg);

  Promise.all([
      Film.findOne({ uuid: filmUuid }),
      User.findOne({ telegramId: msg.from.id })
    ])
    .then(([film, user]) => {
      let isFav = false;

      if (user) {
        isFav = user.films.indexOf(film.uuid) !== -1;
      }
      const favText = isFav ? 'Удалить из избраного' : 'Добавить в избранное';
      const caption = `Название: ${film.name}\nГод: ${film.year}\nРейтинг: ${film.rate}\nДлительность: ${film.length}\nСтрана: ${film.country}`;

      bot.sendPhoto(chatId, film.picture, {
        caption: caption,
        reply_markup: {
          inline_keyboard: [
            [{
              text: favText,
              callback_data: JSON.stringify({
                type: ACTION_TYPE.TOGGLE_FAV_FILM,
                filmUuid: film.uuid,
                isFav: isFav
              })
            }, {
              text: 'Показать кинотеатры',
              callback_data: JSON.stringify({
                type: ACTION_TYPE.SHOW_CINEMAS,
                cinemaUuids: film.cinemas
              })
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
            callback_data: JSON.stringify({
              type: ACTION_TYPE.SHOW_CINEMAS_MAP,
              lat: cinema.location.latitude,
              lon: cinema.location.longitude
            })
          }],
          [{
            text: 'Показать фильмы',
            callback_data: JSON.stringify({
              type: ACTION_TYPE.SHOW_FILMS,
              filmUuid: cinema.films
            })
          }]
        ]
      }
    });
  });
});

bot.on('callback_query', query => {
  const userId = query.from.id;
  let data;

  try {
    data = JSON.parse(query.data);
  } catch (e) {
    throw new Error('Data is not an object');
  }

  const { type } = data;

  switch (type) {
    case ACTION_TYPE.SHOW_CINEMAS_MAP:
      bot.sendLocation(query.message.chat.id, data.lat, data.lon);
      break;
    case ACTION_TYPE.SHOW_CINEMAS:
      sendCinemasByQuery(userId, { uuid: { '$in': data.cinemaUuids } });
      break;
    case ACTION_TYPE.TOGGLE_FAV_FILM:
      toggleFavouriteFilm(userId, query.id, data);
      break;
    case ACTION_TYPE.SHOW_FILMS:
      sendFilmsByQuery(userId, { uuid: { '$in': data.filmUuid } });
      break;
  }
});

bot.on('inline_query', query => {
  Film.find({}).then(films => {
    const results = films.map(f => {
      const caption = `Название: ${f.name}\nГод: ${f.year}\nРейтинг: ${f.rate}\nДлительность: ${f.length}\nСтрана: ${f.country}`;
      return {
        id: f.uuid,
        type: 'photo',
        photo_url: f.picture,
        thumb_url: f.picture,
        caption: caption,
        reply_markup: {
          inline_keyboard: [
            [{
              text: `Кинопоиск: ${f.name}`,
              url: f.link
            }]
          ]
        }
      }
    });

    bot.answerInlineQuery(query.id, results, {
      cache_time: 0
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

function toggleFavouriteFilm(userId, queryId, { filmUuid, isFav }) {
  let userPromise;

  User.findOne({ telegramId: userId })
    .then(user => {
      if (user) {
        if (isFav) {
          user.films = user.films.filter(fUuid => fUuid !== filmUuid);
        } else {
          user.films.push(filmUuid);
        }
        userPromise = user;
      } else {
        userPromise = new User({
          telegramId: userId,
          films: [filmUuid]
        });
      }

      const answerText = isFav ? 'Удалено' : 'Добавлено';

      userPromise.save().then(_ => {
        bot.answerCallbackQuery({
          callback_query_id: queryId,
          text: answerText
        })
      }).catch(err => console.log(err));
    }).catch(err => console.log(err));
}

function showFavouriteFilms(chatId, userId) {
  User.findOne({ telegramId: userId })
    .then(user => {
      if (user) {
        Film.find({ uuid: { '$in': user.films } }).then(films => {
          let html;

          if (films.length) {
            html = films.map((f, i) => {
              return `<b>${i + 1}</b> ${f.name} - <b>${f.rate}</b> (/f${f.uuid})`;
            }).join('\n');
          } else {
            html = 'Вы пока ничего не добавили';
          }
          sendHTML(chatId, html, 'home');
        });
      } else {
        sendHTML(chatId, 'Вы пока ничего не добавили', 'home');
      }
    });
}

function sendCinemasByQuery(userId, query) {
  Cinema.find(query).then(cinemas => {
    const html = cinemas.map((c, i) => {
      return `<b>${i + 1}</b> ${c.name} - /c${c.uuid}`;
    }).join('\n');
    sendHTML(userId, html, 'home');
  });
}