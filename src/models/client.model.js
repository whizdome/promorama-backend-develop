const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { ROLE } = require('../helpers/constants');
const { generateOTP } = require('../utils/random');

const ClientSchema = new mongoose.Schema(
  {
    companyName: {
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

    statesFilterGroups: [
      {
        name: { type: String, trim: true, lowercase: true },
        states: [{ type: String, trim: true, lowercase: true }],
      },
    ],

    role: {
      type: String,
      default: ROLE.CLIENT,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
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

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    showOnStoreCreation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Hash plain text password
ClientSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Password verification
ClientSchema.methods.verifyPassword = async function (enteredPassword) {
  const verify = await bcrypt.compare(enteredPassword, this.password);
  return verify;
};

// Generate password reset token
ClientSchema.methods.generatePasswordResetToken = function () {
  const token = generateOTP();
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

// Generate email verification token
ClientSchema.methods.generateEmailVerificationToken = function () {
  const token = generateOTP();
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Client = mongoose.model('Client', ClientSchema);
module.exports = Client;
