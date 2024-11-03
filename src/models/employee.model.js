const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { generateOTP } = require('../utils/random');

const EmployeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    phoneNumber: {
      type: String,
      match: [/^\+[1-9]\d{1,14}$/, 'Phone number must be in international format'],
      trim: true,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [8, 'Password must be at least eight characters'],
      match: [
        /^(?=.*[0-9])(?=.*[a-zA-Z])(?=\S+$).{8,}$/,
        'Password must contain at least one letter and one numeric digit',
      ],
      select: false,
    },

    profilePicture: {
      type: String,
      default:
        'https://res.cloudinary.com/aoproton/image/upload/v1592466937/ichurch/uccsobarpmaobunukx6v.png',
    },

    address: {
      type: String,
      default: null,
    },

    deviceId: {
      type: String,
      default: null,
    },

    isDeviceChangeRequested: {
      type: Boolean,
      default: false,
    },

    deviceChangeRequestReason: {
      type: String,
      default: null,
    },

    deviceChangeRequestsCount: {
      type: Number,
      default: 0,
    },

    role: {
      type: String,
      required: true,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationTokenExpires: {
      type: Date,
      select: false,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    socketId: {
      type: String,
      default: null,
    },

    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// EmployeeSchema.pre('find', function (next) {
//   this.where({ isDeleted: false });
//   next();
// });

// Hash plain text password
EmployeeSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Password verification
EmployeeSchema.methods.verifyPassword = async function (enteredPassword) {
  const verify = await bcrypt.compare(enteredPassword, this.password);
  return verify;
};

// Generate password reset token
EmployeeSchema.methods.generatePasswordResetToken = function () {
  const token = generateOTP();
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

// Generate email verification token
EmployeeSchema.methods.generateEmailVerificationToken = function () {
  const token = generateOTP();
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Employee = mongoose.model('Employee', EmployeeSchema);
module.exports = Employee;
