const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { generateOTP } = require('../utils/random');

const AdminSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },

    lastName: {
      type: String,
      required: true,
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

    isDefaultAdmin: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      required: true,
    },

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetTokenExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// Hash plain text password
AdminSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Password verification
AdminSchema.methods.verifyPassword = async function (enteredPassword) {
  const verify = await bcrypt.compare(enteredPassword, this.password);
  return verify;
};

// Generate password reset token
AdminSchema.methods.generatePasswordResetToken = function () {
  const token = generateOTP();
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Admin = mongoose.model('Admin', AdminSchema);
module.exports = Admin;
