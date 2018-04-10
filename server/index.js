'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')
var argon2 = require('argon2')

require('dotenv').config()

var connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect()

module.exports = express()
  .set('view engine', 'ejs')
  .set('views', 'view')
  .use(express.static('static'))
  .use(bodyParser.urlencoded({extended: true}))

  .get('/', open)
  .get('/registreren', registreren)
  .get('/index', open)
  .get('/indexingelogd', loggedIn)
  .get('/inloggen', loginForm)
  .get('/matchdetail', matchDetail)
  .get('/lijst', lijst)
  .get('/mijnprofiel', mijnProfiel)

  .post('/registreren', registreer)
  .post('/login', login)

  .listen(8000)

function registreer(req, res, next)
{
  var gebruikersnaam = req.body.naam
  var wachtwoord = req.body.wachtwoord
  var min = 5
  var max = 160

  if (!gebruikersnaam || !wachtwoord)
  {
    res
    .status(400)
    .send('naam of wachtwoord ontbreekt')
    return
  }

  if(wachtwoord.length < min || wachtwoord.length > max)
  {
    res
    .status(400)
    .send('Uw wachtwoord moet tussen ' + min + ' en ' + max + ' tekens zijn.')
  }

  connection.query('SELECT * FROM gebruikers WHERE naam = ?',
  gebruikersnaam, done)

  function done(err, data)
  {
    if (err)
    {
        next(err)
    }
    else if (data.length !== 0)
    {
        rest.status(409) .send('Die naam is al in gebruik')
    }
    else
    {
        argon2.hash(wachtwoord).then(onhash, next)
    }
  }
  function onhash(hash)
  {
    connection.query('INSERT INTO gebruikers SET ?',
    {
      naam: gebruikersnaam,
      wachtwoord: hash,
      geboortedatum: req.body.geboortedatum,
      geslacht: req.body.geslacht,
      keuken: req.body.keuken,
      voorkeur: req.body.voorkeur,
      locatie: req.body.locatie,
      email: req.body.email,
    }, verwerkRegistratie)

    function verwerkRegistratie(err)
    {
      if (err)
      {
        next(err)
      }
      else {
        {
          res.redirect('/')
        }
      }
    }
  }
}

function login(req, res, next)
{
  var naam = req.body.naam
  var wachtwoord = req.body.wachtwoord

  if (!naam || !wachtwoord) {
    res
      .status(400)
      .send('Username or password are missing')

    return
  }

  connection.query(
    'SELECT * FROM gebruikers WHERE naam = ?',
    naam,
    done
  )

  function done(err, data)
  {
    var user = data && data[0]

      if (err)
      {
        next(err)
      }
      else if (user)
      {
        argon2
          .verify(user.hash, wachtwoord)
          .then(onverify, next)
      }
      else
      {
        res
          .status(401)
          .send('Username does not exist')
      }

      function onverify(match)
      {
        if (match)
        {
          res.redirect('/')
        }
        else
        {
          res.status(401).send('Password incorrect')
          console.log('jij bent dom')
        }
      }
    }
}

function open(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('index.ejs', Object.assign({}, result))
}

function loginForm(req, res, next)
{
  connection.query('SELECT * FROM gebruikers', done)

  function done(err, data){
    if (err){
      next(err)
    } else {
    res.render('login.ejs', {data: data})
    }
  }
}

function registreren(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('registreren.ejs', Object.assign({}, result))
}

function loggedIn(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('indexingelogd.ejs', Object.assign({}, result))
}

function lijst(req, res)
{
  connection.query('SELECT * FROM gebruikers', done)

  function done(err, data){
    if (err){
      next(err)
    } else {
    res.render('lijst.ejs', {data: data})
    }
  }
}

function matchDetail(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('matchdetail.ejs', Object.assign({}, result))
}

function mijnProfiel(req, res)
{
  var result = {
      errors: [],
      data: undefined
  }
  res.render('mmijnprofiel.ejs', Object.assign({}, result))
}
