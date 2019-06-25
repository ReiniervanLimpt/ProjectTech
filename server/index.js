 'use strict'

 var PORT = process.env.DB_PORT;
 var express = require('express')
 var bodyParser = require('body-parser')
 var mongo = require('mongodb')
 var argon2 = require('argon2')
 var session = require('express-session')
 var fs = require('fs');
 const MongoClient = require('mongodb').MongoClient;

 require('dotenv').config()

 /* var url = 'mongodb://' + process.env.DB_HOST + ':' + process.env.DB_PORT

 mongo.MongoClient.connect(url, {
   useNewUrlParser: true
 }, function(err, client) {
   if (err) throw err
   db = client.db(process.env.DB_NAME)
   useNewUrlParser: true
 }) */

 var db = null
 const uri = "mongodb+srv://deployAdmin:L3kk3rdeploy@foodlove-i09d7.mongodb.net/test?retryWrites=true&w=majority"
 MongoClient.connect(uri, {
   useNewUrlParser: true
 }, function(err, client) {
   if (err) throw err
   console.log('Connected...')
   db = client.db(process.foodlove)
 })

 module.exports = express()
   .set('view engine', 'ejs')
   .set('views', 'view')
   .use(express.static('static'))
   .use(bodyParser.urlencoded({
     extended: true
   }))

   .get('/', open)
   .get('/registreren', registreren)
   .get('/inloggen', loginForm)
   .get('/matches', matches)
   .get('/mijnaccount', account)

   .post('/registreren', registreer)
   .post('/login', login)
   .post('/filter', filterResultaten)
   .post('/updaten', updateAccount)

   .delete('/verwijderen', verwijderGebruiker)

   .use(session({
     resave: false,
     saveUninitialized: true,
     secret: "ilikecats"
   }))

   .listen(8000)

 function registreer(req, res, next) {
   var gebruikersnaam = req.body.naam
   var wachtwoord = req.body.wachtwoord
   var min = 5
   var max = 160

   if (!gebruikersnaam || !wachtwoord) {
     res
       .status(400)
       .send('naam of wachtwoord ontbreekt')
     return
   }

   if (wachtwoord.length < min || wachtwoord.length > max) {
     res
       .status(400)
       .send('Uw wachtwoord moet tussen ' + min + ' en ' + max + ' tekens zijn.')
   } else {
     argon2.hash(wachtwoord).then(onhash, next)
   }

   function onhash(hash) {
     db.collection("gebruikers").insertOne({
       naam: gebruikersnaam,
       hash: hash,
       geboortedatum: req.body.geboortedatum,
       geslacht: req.body.geslacht,
       keuker: req.body.keuken,
       voorkeur: req.body.voorkeur,
       locatie: req.body.locatie,
       email: req.body.email,
       beschrijving: req.body.beschrijving
     }), verwerkRegistratie()

     function verwerkRegistratie(err) {
       if (err) {
         next(err)
       } else {
         db.collection('gebruikers').find().toArray(done)

         function done(err, data) {
           if (err) {
             next(err)
           } else {
             res.render('index.ejs', {
               data: data,
               user: session.user
             })
           }
         }
       }
     }
   }
 }

 function login(req, res, next) {
   var email = req.body.email
   var wachtwoord = req.body.wachtwoord

   if (!email || !wachtwoord) {
     res
       .status(400)
       .send('Username or password are missing')
     return
   }

   db.collection('gebruikers').findOne({
     email: email
   }, done)

   function done(err, data) {

     var user = {
       data: data
     }

     if (err) {
       next(err)
     } else if (user.data) {
       argon2
         .verify(user.data.hash, wachtwoord)
         .then(onverify, next)
     } else {
       res.status(401)
         .send('Gebruiker bestaat niet')
     }

     function onverify(match) {
       if (match) {
         session.user = {
           naam: user.data.naam
         };
         open(req, res)
       } else {
         res.status(401).send('Password incorrect')
       }
     }
   }
 }

 function loginForm(req, res, next) {
   res.render('login.ejs')
 }

 function registreren(req, res) {
   res.render('registreren.ejs')
 }

 function open(req, res) {
   res.render('index.ejs', {
     user: session.user
   })
 }

 function matches(req, res) {
   if (!session.user) {
     res.render('index.ejs')
   } else {
     var naam = session.user.naam
     db.collection('gebruikers').find().toArray(done)

     function done(err, data) {
       if (err) {
         next(err)
       } else {
         res.render('matches.ejs', {
           data: data
         })
       }
     }
   }
 }

 function account(req, res) {
   console.log(session.user)
   if (!session.user) {
     res.render('index.ejs')
   } else {
     var naam = session.user.naam
     db.collection('gebruikers').find({
       naam: naam
     }).toArray(done)
   }

   function done(err, data) {
     if (err) {
       next(err)
     } else {
       res.render('account.ejs', {
         data: data,
         user: session.user
       })
     }
   }
 }

 function updateAccount(req, res) {
   var naam = session.user.naam
   if (!session.user) {
     res.render('index.ejs')
   } else {
     db.collection("gebruikers").updateOne({
         "naam": naam
       }, {
         $set: {
           "keuker": req.body.keuken,
           "voorkeur": req.body.voorkeur,
           "locatie": req.body.locatie
         }
       }),
       db.collection('gebruikers').find({
         naam: naam
       }).toArray(done)
   }

   function done(err, data) {
     if (err) {
       next(err)
     } else {
       res.render('account.ejs', {
         data: data,
         user: session.user
       })
     }
   }
 }

 function filterResultaten(req, res) {
   var keuken = req.body.keuken
   if (keuken !== "Alle keukens") {
     db.collection('gebruikers').find({
       keuker: keuken
     }).toArray(done)

     function done(err, data) {
       if (err) {
         next(err)
       } else {
         res.render('matches.ejs', {
           data: data
         })
       }
     }
   } else {
     db.collection('gebruikers').find().toArray(done)

     function done(err, data) {
       if (err) {
         next(err)
       } else {
         res.render('matches.ejs', {
           data: data
         })
       }
     }
   }
 }

 function verwijderGebruiker(req, res, next) {
   req.session.destroy(function(err) {
     if (err) {
       next(err)
     } else {
       db.gebruikers.deleteOne({
         naam: naam
       })
       res.redirect('/')
     }
   })
 }