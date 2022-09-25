const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Setting up the template engine {for frontend}
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // We need to confirm that either we recive the request has '/' or not, the path is alwas correct

// 1.Global Middle wares
// Serving static files
app.use(express.static(path.join(__dirname, 'public'))); // By coding this we are just saying that all the static files should be send from the folder 'public'

// Setting security for HTTP headers
app.use(helmet()); // Here we run helmet() & this will generate the code for this middle ware, Helmet is used to prvide a better quality & secure HTTP headers



// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting req from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // Allow the max 100 requests from one ip within 1 hour
  message: 'Too many requests from this IP, please try in an hour!',
});

app.use('/api', limiter); // Use the limiter middleware in all the req through the /api route

// Body Parser, reading data from the body to req.body
app.use(express.json({ limit: '10kb' }));

// Data santization against NOSQL query injection
app.use(mongoSanitize()); // This just removes all the $ and other special characters from the requests that no mongo query can be passed in the req.params / req.body🙂

// Data santization against XSS
app.use(xss());

// Prevent parameter pollution {means passing on the dual params with same name in the req.params}
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);


// Very basic middleware {just for test}
app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});

// 3. Routes

// Sending pug templates
// In the viewRoutes.js File //

app.use('/', viewRouter); // Mounting router for the view files serving
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find the ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;

  next(new AppError(`Can't find the ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);


module.exports = app;
