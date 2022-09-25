const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const User = require('./userModel');
const Review = require('./reviewModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String, //Validator
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tour name must have less or equal than 40 characters'], //Validator
      minlength: [5, 'Tour name must have less or equal than 10 characters'], //Validator
      //   validate: [validator.isAlpha, 'Tour name must only contain the alphabets'] //Validator
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Valid difficulties easy/medium/difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating should be a number between 1-5'], //Validator
      max: [5, 'Rating should be a number between 1-5'], //Validator
    },
    ratingQuantity: {
      type: Number,
      default: 0, //Validator
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // This only points to current doc on NEW DOCUMENT creation
        validator: function (val) {
          return val < this.price; // Return true and validate only if discount is less than price
        },
      },
      message: 'Discount should always be less than price',
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String], // We have a array of string of images here then we are going to iterate over then and get the single images fom ere
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    slug: String,
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    // Embedding the locations in startLocaton Json
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,

      locations: [
        {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
          },
          coordinates: [Number],
          address: String,
          description: String,
          day: Number,
        },
      ],
    },

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  // Enabling virtual properties

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing
tourSchema.index({ price: 1, ratingsAverage: -1 }); // Sabse lam se sabse jeyada price, sabse jeyada s sabse kam ratings average
tourSchema.index({ slug: 1 });
// tourSchema.index({ guides: 1 }); // Was just to debug🙂
tourSchema.index({ startLocation: '2dsphere' });

// Virtual properties
tourSchema.virtual('durationWeeks').get(function () {
  // Not using arrow function as it not has its own this keyword
  return this.duration / 7; // Setting the duration weeks property to the value of duration / 7
});

// Virtual populate
tourSchema.virtual('reviews', {
  //'revies' is the name of virtual feild to be created
  ref: 'Review',
  foreignField: 'tour', // By what name the child stores this data 'tour'
  localField: '_id', // By what name the here ie the parent stores this data 'tour'
});


// MIDDLEWARES
// Document Middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //Slugify just nicely creates a string based on the options that we pass to it
  next();
});

tourSchema.pre('save', async function (next) {
  const guidesPromises = this.guides.map(async (id) => await User.findById(id)); // This gives an array full of promises

  this.guides = await Promise.all(guidesPromises);

  next();
});

// Querry middlewares
tourSchema.pre(/^find/, function (next) {
  // Using RE to make it for all starting with  x find {--> findOne, findOneAndUpdate}
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now(); // Just for fun 🙂 to chk the time b/w post and pre middle wares execution
  next();
});

tourSchema.pre(/^find/, function (next) {
  // Now all the querries will poulate the guides feild in the response

  // Here 'this' is: The Querry Object that is passed on through client🙂

  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  this.populate({
    path: 'reviews',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (doc, next) {
  console.log(`Querry took ${Date.now() - this.start} ms`); // As the post is exectuted after pre
  next();
});

// Aggregation middlewares
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // The this.pipeline() is an array of pipeline stages, we just add this extra stage at its start
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//     console.log('Will save the document');
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
