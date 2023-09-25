require('dotenv').config();

const express = require('express');
const logger = require('morgan');
const cookieParser = require('cookie-parser');

const TEST = process.env.NODE_ENV && process.env.NODE_ENV.toLowerCase() === 'test'
const DEBUG = process.env.NODE_ENV ? process.env.NODE_ENV.toLocaleLowerCase() !== 'production' : true;
const PORT = process.env.PORT || 3000;

const configureApp = (middleware) => {

    const app = express();
    app.use(logger('dev'));
    app.use(express.json());
    app.use(cookieParser(process.env.COOKIE_SECRET))

    if (middleware) app.use(middleware);

    return app;
}

const app = configureApp();


if (!TEST) {
    app.listen(PORT, () => {
        console.log(`Authentication microservice running on port ${PORT}`);
    });
}

module.exports = { app, configureApp }