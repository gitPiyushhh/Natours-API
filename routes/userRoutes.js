const express = require('express');
const usersController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup); // This does not follow REST {Name of route tells its fctn}
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPasswrord);

// Middlewares run in a sequence so we will mount them on the rutouter itself
router.use(authController.protect);

router.patch(
  '/updateMyPassword',
  authController.updatePassword
); // Edit password

router.patch('/updateMe', usersController.updateMe); // Edit the other user details
router.delete('/deleteMe', usersController.deleteMe); // Deactivte the user temporarily

router
  .route('/me')
  .get(usersController.getMe, usersController.getUser); 

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(usersController.getAllUsers)
  .post(usersController.createUser);
router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateMe)
  .delete(
    authController.restrictTo('admin', 'lead-guide'),
    usersController.deleteMe
  ); // All these middlewares are going to be run in order if any error then straight away return Error

module.exports = router;
