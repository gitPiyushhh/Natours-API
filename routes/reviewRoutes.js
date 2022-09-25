const express = require('express');

const reviewsController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// Using merge params for nested querries
const router = express.Router({ mergeParams: true }); // Merging the params of mounted routers

router.use(authController.protect); // We dont want anyone who is not logged in to perform any of the below actions

router
  .route('/')
  .get(reviewsController.getAllreviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewsController.setTourUserIds,
    reviewsController.createReview
  );

router
  .route('/:id')
  .get(reviewsController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewsController.updateReview 
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewsController.deleteReview
  );

module.exports = router;
