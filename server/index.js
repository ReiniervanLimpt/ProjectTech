'use strict'

var express = require('express')
var bodyParser = require('body-parser')

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use(bodyParser.urlencoded({extended: true}))


  .get('/', open)
  .get('/registreren.ejs', renderPage)

  .listen(8000)

function open(req, res)
{
  console.log('werkt boi')
  var result = {
      errors: [],
      data: undefined
  }
  res.render('index.ejs', Object.assign({}, result))
}

function renderPage(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('registreren.ejs', Object.assign({}, result))
}
