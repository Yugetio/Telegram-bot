const kb = require('./keyboard-btn');
module.exports = {
  home: [
    [kb.home.films, kb.home.cinemas],
    [kb.home.favourite]
  ],
  films: [
    [kb.film.ection, kb.film.comedy],
    [kb.film.random],
    [kb.back]
  ]
};