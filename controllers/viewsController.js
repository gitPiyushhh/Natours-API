const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  //1. Get tour data from collection{DB}
  const tours = await Tour.find();

  // 2. Build templates

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res) => {
  // 1. Get the data for the requested tour
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    feilds: 'review rating user'
  });

  // 2. Build template

  // 3. Render template using Data from first 
  res.status(200).render('tour', { // Above tour is the name of the template while the below one is the options passed on to the pug as data
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = catchAsync(async (req, res) => {
  res.status(200).render('./../views/login.pug', {
    title: 'Login'
  });
})
