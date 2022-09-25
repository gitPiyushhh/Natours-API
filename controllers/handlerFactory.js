const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apifeatures');


exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id); // All names should be generic

  
    if (!doc) {
      return next(new AppError('No tour fonund with id', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document fonund with id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body); // All those feilds that are in the req.body but not in the chema they are siply ignored here!

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); // Create the query
    if (popOptions) query = query.populate(popOptions); //If populate then populate it
    const doc = await query; // At end await the query
  
    if (!doc) {
      return next(new AppError('No document fonund with id', 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
});

exports.getAll = (Model) => catchAsync(async (req, res, next) => {
    // Allow the nested GET Routes (hack)
    let filter = {}
    if (req.params.tourId) { filter = { tour: req.params.tourId }; }  // If there is a tour id then find with this filter object else with empty objects {for all the reviews}

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
  
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc
      }
    });
  });
