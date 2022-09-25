// Review -> {rating , createdAt, ref To Tour, ref to user}

const mongoose = require('mongoose');

const Tour = require('./tourModel');
const User = require('./userModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cant be empty'],
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
    },

    
    createdAt: {
      type: Date,
      default: Date.now(),
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must be connected to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A user must be connected to a user'],
    },
  },

  {
    // Make the virtual properties true whenever its converted to JSON or the Object
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre Query middlewares
reviewSchema.pre(/^find/, function (next) {
    // // Here 'this' is the current querry object
    // this.populate({
    //     path: 'tour', // tour will take the tour from the model & populate it..
    //     select: 'name' // Only add  the name from the tour
    // }).populate({
    //     path: 'user', // Look up to the model, find the feild user and populate it in the current querry
    //     select: 'name photo' // We dont want to leak the private details of the user just leak name and photo
    // })
    // next();  // behind the scenes, mongoose has to do the querry twice here one for tour and another for the user

    // In this app there is no meaning of having the tour again in the review so we remove populating the tours and guides in the review
    
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next(); 
});

// Calculating the rtings average through agrregaton pipeline
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {tour: tourId},
    },

    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);

  // Persisting the data to DB {But not working for now, Dont know why😥 will update this lately🙂}


  // if (stats.length > 0) {
  //   await Tour.findByIdAndUpdate(tourId, {
  //     ratingsQuantity: stats[0].nRating,
  //     ratingsAverage: stats[0].avgRating
  //   });
  // } else {
  //   await Tour.findByIdAndUpdate(tourId, {
  //     ratingsQuantity: 0,
  //     ratingsAverage: 4.5
  //   });
  // }
}

reviewSchema.post('save' , function () {
  // this points to the current review

  // constructor points to the current model
  this.constructor.calcAverageRatings(this.tour); // The post middle ware does not has its next() fctn
})

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});


reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;