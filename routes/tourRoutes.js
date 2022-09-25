const express = require('express');
const toursController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// Mountng the tour roter on review router if there is any nested querry
router.use('/:tourId/reviews', reviewRouter);

// ALIASING {--> SHortcut way to get the specific target documents}
router
  .route('/top-5-cheap')
  .get(toursController.aliasTopTour, toursController.getAllTours); // Here we pass the one middle ware function and all the functionality of the old get all tours function {Means get all tours with just an abstraction of extra aliasTopTour middleware}

// Aggregation pipeline
router.route('/tour-stats').get(toursController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'guide', 'lead-guide'),
    toursController.getMonthlyPlan
  );

// Geospatial Querries
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(toursController.getToursWithin);

// Geospatial2: Calculating the distance from current point to the tour start location automatically
router.route('/distances/:latlng/unit/:unit').get(toursController.getDistances);

router
  .route('/')
  .get(toursController.getAllTours) // authController.protect This is the middleware fctn & is if true then return all values of Tours else no
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.createTour
  );

router
  .route('/:id')
  .get(toursController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.deleteTour
  );

//NESTED ROUTING
// POST/tourw/i96161d/reviews
// GET/tourw/i96161d/reviews
// GET/tourw/i96161d/reviews/dh6565e

/* We are doing this here coz its the parent route and through this the subroute is going to be called */
/*
router
  .route('/:tourId/reviews')
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );
*/


module.exports = router;
