require('dotenv').config();
const express=require('express');
const session=require('express-session');
const helmet = require('helmet');
const passport = require('passport');
const path = require('path');
require('./config/passport');            // stratégies Google/Apple
const authRoutes = require('./routes/auth.routes');
const pagesRoutes = require('./routes/pages.routes')
const app=express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // nécessaire pour les formulaires et le callback Apple (POST)
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}))
app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/', pagesRoutes);
const PORT = process.env.PORT;
app.listen(PORT,()=>{
    console.log(`le serveur lancer sur http://localhost:${PORT}`);
})