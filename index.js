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




/* 
//событие срабатывает когда пользователь отправляет команду или сообщение
bot.on('message', msg => { // в качестве msg будет обект с данными о пользователе и чате
  const { id } = msg.chat;
  const { text } = msg;

  if (text.toLowerCase() == 'hello' || text.toLowerCase() == 'привет') {
    //метод принимает 3 аргумента и возвращает клиенту сообщение. 1-й аргумент - айди чата, 2-й сообщение, 3-й обект с настройками
    bot.sendMessage(id, `Hello, ${msg.chat.first_name}`);
  } else {
    bot.sendMessage(id, JSON.stringify(msg, null, 4));
  }
}); */




// метод получает регулярное выражения команды ( /help ) и функцию оброботчик какая принимает обект ( msg ) и остальные данные (например массив если указать дополнительную группу в регулярке)
//парсинг html и markdown
//html
/* bot.onText(/\/start/, msg => {
  const { id } = msg.chat;
  const html = `<strong>Hello, ${msg.from.first_name}</strong>
  <i>Your info:</i>
  <pre>${JSON.stringify(msg, null, 4)}</pre>`;

  bot.sendMessage(id, html, { parse_mode: 'HTML' });
}); */

//markdown https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
// bot.onText(/\/start/, msg => {
//   const { id } = msg.chat;
//   const markdown = `
//     *Hello, ${msg.from.first_name}*
//     _Your info:_
//     \`\`\`${JSON.stringify(msg, null, 4)}\`\`\`
//   `;

//   bot.sendMessage(id, markdown, { parse_mode: 'markdown' });
// });




/* 
//отображения превью сообщения и уведомления о новом сообщении
bot.on('message', msg => {
  if (msg.text[0] !== '/') {

    console.log(msg.from.first_name, msg.text);
    bot.sendMessage(msg.chat.id, 'https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet', {
      disable_web_page_preview: true, //без превью
      disable_notification: true //без оповещений
    });
    bot.sendMessage(msg.chat.id, 'https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet');

  }
});
 */



/* //получаем текст введенный после команды
bot.onText(/\/help (.+)/, (msg, [source, match]) => {
  const { id } = msg.chat;

  bot.sendMessage(id, match);
}); */



//Создании клавиатуры с кнопками 
/* bot.on('message', msg => {
  console.log(msg);

  if (msg.text === 'Закрыть') {
    bot.sendMessage(msg.chat.id, 'Закрываю', {
      reply_markup: {
        remove_keyboard: true
      }
    });
  } else if (msg.text === 'Ответить') {

    bot.sendMessage(msg.chat.id, 'Отвечаю', {
      reply_markup: {
        force_reply: true
      }
    });

  } else {

    bot.sendMessage(msg.chat.id, 'Клавиатура', {
      reply_markup: {
        keyboard: [
          [{
            text: 'Отправить местоположение',
            request_location: true
          }],
          ['Ответить', 'Закрыть'],
          [{
            text: 'Отправить контакт',
            request_contact: true
          }]
        ],
        one_time_keyboard: true // используется только раз при вызове
      }
    });

  } 
}); */


/* // создания инлайн клавиатуры
bot.on('message', msg => {

  bot.sendMessage(msg.chat.id, 'inline keyboard', {
    reply_markup: {
      inline_keyboard: [
        [{
          text: 'google',
          url: 'google.com'
        }],
        [{
          text: 'Reply',
          callback_data: 'reply'
        }, {
          text: 'Forward',
          callback_data: 'forward'
        }]
      ]
    }
  });

});

// срабатывает после нажатия на кнопку инлайн клавиатуры
bot.on('callback_query', query => {
  bot.sendMessage(query.message.chat.id, JSON.stringify(query, null, 4)); // отсылает ответ при нажатии на кнопку
  // bot.answerCallbackQuery(query.id, `${query.data}`); //alert
}); */