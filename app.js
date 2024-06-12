const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const userRouter = require('./routes/userRoutes');
const tourRouter = require('./routes/tourRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Make Express trust proxy
app.enable('trust proxy');

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1. GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': [
          "'self'",
          'https://unpkg.com',
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com',
          "'unsafe-eval'",
        ],
        'img-src': ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
        'connect-src': [
          "'self'",
          'http://127.0.0.1:8000',
          'https://js.stripe.com',
        ],
        'frame-src': ["'self'", 'https://js.stripe.com'],
        'worker-src': ["'self'", 'https://js.stripe.com'],
      },
    },
  })
);

// Enable CORS for req all routes
// app.use(
//   cors({
//     origin: 'https://natours-l3nu.onrender.com',
//     methods: ['GET', 'POST', 'PATCH', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//   })
// );
app.use(cors());
app.options('*', cors()); // Authorizing non simple req

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
  keyGenerator: (req) => req.ip,
});
app.use('/api', limiter);

// // Read data from HTML FORM REQ (not used in that project)
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Checkout Stripe (format stream, converted to JSON thank to the line below)
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Compress txt res to client
app.use(compression()); // Test on gzip (Google)

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2. ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3. ERROR HANDLING
app.use(globalErrorHandler);

module.exports = app;
