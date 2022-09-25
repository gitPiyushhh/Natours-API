const Tour = require('../models/tourModel');
const User = require('../models/userModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./../controllers/handlerFactory');
// Reading the tours here
// const tours = JSON.parse(
//     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// Aliasing:  Creating the self made querry to a spacific route only {--> prefilling the querry strings specific params}
exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5'; // We need only 5 documents
  req.query.sort = '-ratingsAverage, price';
  req.query.feilds = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

// exports.getAllTours = catchAsync(async (req, res, next) => {
// SEND RESPONSE

////////////////////////////// THIS IS THE OLD CODE VERSION THE EFFICIENT VERSION IS IN THE utils/apiFeatures.js //////////////////

// const tours = await Tour.find(
// //   {
// //   duration: 5,
// //   difficulty: 'easy'
// // }
// // We are going to create a req.query object and then on basis of that we will filter the results
// query
// )

// BUILD QUERRY

// 1A) Filtering
//  We cant implement this because we will have the sorted and paginated results then we have to use the different querry object, So for that we need to follow the following way

/*
    
    // 1. Create a shallow copy of request object
    const queryObj = { ...req.query };
    //2. Create the array of excluded feilds
    const excludedFeilds = ['page', 'sort', 'limit', 'feilds'];
    // 3. Loop over the excludedFeilds array and remove the specific feilds from the queryObj
    excludedFeilds.forEach((el) => {
      delete queryObj[el];
    });

    // 1B) Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    // console.log(queryObj); //This gives us the query object from request with nice object formatting in the firstplace

    let query = Tour.find(JSON.parse(queryStr));

    */

// 2) Sorting

/*
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' '); //Split the string and join it using the empty space '
      query = query.sort(sortBy); //If there is sort to true in the res.query the auto sort the given Values
    } else {
      query = query.sort('-createdAt'); // Default to get the newest created cards first in our list
    }
    */

// 3) Feilds Limiting

/*
    if (req.query.feilds) {
      const feilds = req.query.feilds.split(',').join(' '); //Split the string and join it using empty spaces Eg: Querry= ?feilds=name,duration,price
      query = query.select(feilds);
    } else {
      query = query.select('-__v');
    }
    */

/*
    // 4) Pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    //If Page=3 and Limit=10: Then we want the range b/w 21-30: So basically we want to skip 20 results and go directly to 21th result and limit the result to 10🙂
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments(); //Count all the number of documents in the scema

      if (skip >= numTours) {
        throw new Error('Page limit exceeded'); //Throw new error and move to the catch block
      }
    }
    */

//EXECUTE QUERRY

// Process: We are going to continuously update the querry with all the keywords that are present in the query and then await for the target query result data from the already read json and then pass the result to the client , simple🙂

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const tours = await features.query;

//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours: tours,
//     },
//   });
// });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour fonund with id', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });

// if (req.params.id * 1 > tours.length) {
//   res.status(404).json({
//     status: 'fail',
//     message: 'Invalid ID',
//   });
// }
// });

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour); // This model is going to be passed on the factory with the Model: Tour as an argument {Through Closure🙂}

// Agregation pipeline here

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // Here every object is a separate stage and the pipeline is going to be pass through all the stages and get us the computed final data..
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: null, // How do we want to group our data
        _id: { $toUpper: '$difficulty' }, // Group the data on the basis of the difficulty
        numTours: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // $avg gives us the average of all the specific values from the document {Its a matheatical fctn}
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, // Set sort functionality to true on the basis of avgPrice that we calculated just above🙂
    },
    {
      $match: { __id: { $ne: 'EASY' } }, // We can repeat the different stages Here  we are matching all those documents that have the id as not equal to easy
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // Get the year from the request object

  // We will aggregate the data based on the whole pipeline and after passing through all the stages
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },

    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 }, // Adding 1 in the numTourStarts for every tour that starts in a object {-->Month}
        tours: { $push: '$name' }, // We are creating an array of all the names of tours which were in the 2021
      },
    },

    {
      $addFields: { month: '$_id' },
    },

    {
      $project: { _id: 0 },
    },

    {
      $sort: {
        numTourStarts: -1, //Sorting on the basis of num of tours in a month in descending order
      },
    },

    {
      $limit: 12, //Limiting the o/p documents to 6 only
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/233/center/34.111,-118.133/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(','); //Destructure it into its own two variables
  const radius = unit == 'mi' ? distance / 3963.2 : distance / 6378.1; // Here 3963.2 is radius of earth in miles, 6378.1 is radius of earth in km

  if (!lat || !lng) {
    return next(
      new AppError('A location must have the latitude and the longitude!', 400)
    );
  }

  console.log(distance, lat, lng, unit);

  // This $geoWithin querry enables us to find the specific objects that satisfy the certain geometry { The circle that has center of lat and lng point and has radius of distance}
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
