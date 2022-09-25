// const crypto = require('crypto');
// const mongoose = require('mongoose');
// const validator = require('validator');
// const bcrypt = require('bcrypt');

// // User model

// // Feilds: Name, Email, Image, password, password confirm
// const userModel = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [true, 'User must have a name'],
//   },

//   email: {
//     type: String,
//     required: [true, 'User must have a email'],
//     unique: true,
//     lowercase: true,
//     validate: [validator.isEmail, 'Please enter a valid email'],
//   },


//   photo: {
//     type: String,
//   },

//   role: {
//     type: String,
//     enum: ['user', 'guide', 'lead-guide', 'admin'], // Alll type of possible user designatons
//     default: 'user',
//   },

//   password: {
//     type: String,
//     require: [true, 'User must have a password'],
//     minlength: 8,
//     select: false, // Will not be shown up in any get request
//   },

//   passwordConfirm: {
//     type: String,
//     required: [true, 'Please confirm your password'],
//     validate: {
//       // This only works on CREATE and SAVE!!!
//       validator: function (el) {
//         return el === this.password;
//       },
//       message: 'Passwords are not the same!',
//     },
//   },

//   passwordChangedAt: Date,
//   passwordResetToken: String,
//   passwordResetExpires: Date,
// });

// // Password Encryption
// userModel.pre('save', async function (next) {
//   // Only run if the pass was actually modified
//   if (!this.isModified('password')) return next();

//   // Here 12 is the value of cost , the more the value of cost, more secured pass but more cpu task extensive
//   this.password = await bcrypt.hash(this.password, 12);

//   // Now the passwrord confirm of no use
//   this.passwordConfirm = undefined;
//   next();
// });

// // Password Matcher function
// userModel.methods.correctPassword = async function (
//   candidatePassword,
//   userPassword
// ) {
//   return await bcrypt.compare(candidatePassword, userPassword); // We can't mannualy compare coz one is hashed and another one from the req.body
// };

// userModel.methods.changedPasswordAfter = function (jwtTimestamp) {
//   if (this.passwordChangedAt) {
//     const changedTimeStamp = parseInt(
//       this.passwordChangedAt.getTime() / 1000,
//       10
//     );

//     console.log(changedTimeStamp, jwtTimestamp);
//     return jwtTimestamp < changedTimeStamp; // Time token generated < Time pass changed {100 < 200}
//   }
//   return false;
// };

// userModel.methods.createPasswordResetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString('hex'); // This is the token should be given to the user to generate new password

//   const passwordResetToken = crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');

//   console.log({ resetToken }, passwordResetToken);
//   const passwordResetExpires = Date.now() + 10 * 60 * 1000; //Expire in 10 mins

//   this.passwordResetExpires = passwordResetExpires;
//   this.passwordResetToken = passwordResetToken;
  
//   return resetToken;
// };

// const User = mongoose.model('User', userModel);

// module.exports = User;


const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  } 
});

// userSchema.pre('save', async function(next) {
//   // Only run this function if password was actually modified
//   if (!this.isModified('password')) return next();

//   // Hash the password with cost of 12
//   this.password = await bcrypt.hash(this.password, 12);

//   // Delete passwordConfirm field
//   this.passwordConfirm = undefined;
//   next();
// });

// userSchema.pre('save', function(next) {
//   if (!this.isModified('password') || this.isNew) return next();

//   this.passwordChangedAt = Date.now() - 1000;
//   next();
// });

// Query middleware to not show the collections with the 'active: false' property 
userSchema.pre(/^find/, function (next) {
  // Here this points to the current query
  this.find({ active: {$ne: false} }); // First remove all other querries that have actiev to false
  next();
})

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.pre('save' , function(next) {
  if (!this.isModified('password') || this.isNew) return next(); 

  this.passwordChangedAt = Date.now() - 1000; // Here due to lag in saving the password before we aremaking the password property daved{--json web token saved 1 s befor..}
  next();

})  

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;