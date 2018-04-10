'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var mysql = require('mysql')
var argon2 = require('argon2')
var session = require('express-session')

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
  .get('/indexingelogd', loggedIn)
  .get('/inloggen', loginForm)
  .get('/matchdetail', matchDetail)
  .get('/matches', matches)
  .get('/mijnprofiel', mijnProfiel)

  .post('/registreren', registreer)
  .post('/login', login)

  .use(session({
    resave: false,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET
  }))

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
      hash: hash,
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
//          console.log(session)
          session.user = {naam: gebruikersnaam}
          res.redirect('/')
        }
      }
    }
  }
}

function login(req, res, next)
{
  var email = req.body.email
  var wachtwoord = req.body.wachtwoord

  if (!email || !wachtwoord) {
    res
      .status(400)
      .send('Username or password are missing')

    return
  }

  connection.query(
    'SELECT * FROM gebruikers WHERE email = ?',
    email,
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
          res.status(401)
          .send('Gebruiker bestaat niet')
      }

      function onverify(match)
      {
        if (match)
        {
          session.user = {naam: user.naam};
          matches(req, res)
        }
        else
        {
          res.status(401).send('Password incorrect')
        }
      }
    }
}

function open(req, res)
{
  if(!session.user)
  {
    res.render('index.ejs')
  }
  else
  {
    var naam = session.user.naam
    connection.query('SELECT * FROM gebruikers WHERE naam != ?', naam , done)
  }
    console.log(session.user)
    function done(err, data)
    {
      if (err)
      {
        next(err)
      }
      else
      {
        res.render('indexingelogd.ejs', {data: data})
      }
    }
}

function loginForm(req, res, next)
{
  var result = {
      errors: [],
      data: undefined
  }
    res.render('login.ejs', Object.assign({}, result))
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

function matches(req, res)
{
  var naam = session.user.naam
  console.log(session.user)
  connection.query('SELECT * FROM gebruikers WHERE naam != ?', naam , done)

  function done(err, data){
    if (err){
      next(err)
    } else {
    res.render('matches.ejs', {data: data})
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
