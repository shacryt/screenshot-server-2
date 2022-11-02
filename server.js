//Entry point to backend
//Making express server
//Please note that we cannot use import on backend without additional plugins
const express = require('express');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.options('*', cors());

//Connect to db
connectDB();

//Init middleware
app.use(express.json({ extended: false }));

const message =
  'Too many requests have been submitted from this IP in the last minute. Please slow down.';

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message,
});

//Define our routes
app.use('/api/screenshot', limiter, require('./routes/screenshot'));

//Port to listen to
//First we look for production environment variable, then any port for dev
const PORT = process.env.PORT || 5000;

//The syntax is PORT, EVENT, we simply log
app.listen(PORT, () => console.log(`Server started on port ${PORT}.`));
