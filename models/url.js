const normalizeUrl = require('normalize-url');
const validator = require('validator');
const mongoose = require('mongoose');
const memoize = require('memoizee');
const shortid = require('shortid');

const Url = new mongoose.Schema({
  full: {
    type: String,
    required: true,
  },
  short: {
    type: String,
    required: true,
  },
});

// Model methods
Url.statics.shrink = memoize(function(full) {
  return new Promise((resolve, reject) => {
    if (!validator.isURL(full)) reject('Invalid URL');

    this.findOne({ full }).then(url => {
      if (url) resolve(url.short);
      this.create({ full: normalizeUrl(full), short: shortid() }).then(newUrl => {
        resolve(newUrl.short);
      })
    })
  });
});

Url.statics.expand = function(short) {
  return new Promise((resolve, reject) => {
    this.findOne({ short }).then(url => {
      if (!url) reject('Unknown code');
      resolve(url.full);
    });
  })
};

module.exports = mongoose.model('url', Url);
