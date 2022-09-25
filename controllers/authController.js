const { promisify } = require('util'); // TO canvert a normal fcn into promise
const crypto = require('crypto');
// Authentication
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
// Err handling and utility folders
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');


// Token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Sending cookie to client
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // All browsers can only store & send back the cookie, but can never modify it
  };

  // Set only for https
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  // Remove the passwords from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

// Signup functionality
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(
    {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    }
    // Take the data from req and use that to create a new instance of user
  );

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // Destructuring values from req.body

  // 1. Check if the user & pass not passed
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2. Check if the user exist & pass is correct {mtching iwth it}
  const user = await User.findOne({ email: email }).select('+password'); //  find the target & add the password in the res as well

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or pass', 401));
  }

  // 3. If evry thin is corect {send jwt}
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Check if there is any token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // console.log(token)

  if (!token) {
    return next(
      new AppError('You are not logged in, please login to get ]', 401)
    );
  }

  // 2. Chk if the token is valid or not
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // Return an decoded object with id and others params

  // 3. Check if the user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists')
    );
  }

  // 4. Chk if the user changed the password after the token was issud
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please try again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  // This is a wrapper fctn to provide the middleware fctn access to the 'roles'
  return (req, res, next) => {
    // Roles: ['user', 'admin', 'guide', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You dont have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // Destructuring values from req.body
  // 1. Get user based on posted email
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2. Generate random access token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // Deactivate all validators

  // 3. Send it to the user email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password! Submit your patch request with your new password and passwordConfirm to: ${resetURL}. \n If you not forgot your password then please ignore this message🙂`;

  //Using a try catch block as here if err occurs we have to do more work than just grabbing the err msg
  try {
    // Sending email finally {Its a promise}
    await sendEmail({
      email: user.email,
      subject: 'Your Password reset Token (Valid for 10 min)',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token send to the email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return new AppError(
      'There was an error sending the email. Please try again later!',
      500
    );
  }
});

exports.resetPasswrord = catchAsync(async (req, res, next) => {
  // 1. Get the user based on reset Token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  const test = await User.findOne({ email: 'piyushhhagarwal@gmail.com' });
  console.log(`This is just test: ${test.passwordResetToken}, ${hashedToken}`);

  console.log(user);

  // 2. If token is not expired, and there is a user then, set the new password
  if (!user) {
    return next(new AppError('Token is expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save({ validateBeforeSave: false }); // Deactivate all validators

  // 3. Update changed password at property

  // 4.Log the user in, send JWT
  createSendToken(user, 200, res);

  next();
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
