const Review = require('./../models/reviewModel')

// Error control modules
// const catchAsync = require('./../utils/catchAsync')
// const AppEroor = require('./../utils/appError')

const factory = require('./../controllers/handlerFactory');


exports.setTourUserIds = (req, res, next) => {
    // If value of tour not passed in the body then it must be from the nested route {Allow nested routes }
    if (!req.body.tour) { req.body.tour = req.params.tourId }
    if (!req.body.user) { req.body.user = req.user.id } // Yeah kaha s aaya yeah hame bhi nahi pata😥 {Jonas chacha toh bole kii authController.protect middleware s aayeg}

    next();
}

exports.getAllreviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review); // Using the handler factory and passing model in it
