const User = require('../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');

const factory = require('./../controllers/handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach(el => {
    if(allowedFields.includes(el)) newObj[el] = obj[el]; // Create new key value pair with obj[el]
  })
  return newObj;
}

// Very Simple middle ware just to setup the current logged in user id in req.params

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}


exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Create error if the user tries to update the password here
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password change! Please use /updateMyPassword',
        400
      )
    );
  }

  // 2. Filtered out unwanted feilds that we not want to be updated
  // We are using the x becoz we dont want to allow the user to change there role from 'user' to 'admin'
  const filteredBody = filterObj(req.body, 'name', 'email');
  
  // 3. Update the user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});


// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'Error',
//     message: 'This route is not yet defined',
//   });
// };


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'Error',
    message: 'This route is not defined! Please use signup instead',
  });
};


exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateMe = factory.updateOne(User); // Do Not Update password with this!
exports.deleteMe = factory.deleteOne(User);