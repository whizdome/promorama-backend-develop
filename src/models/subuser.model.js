const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { ROLE } = require('../helpers/constants');
const { generateOTP } = require('../utils/random');

const SubuserSchema = new mongoose.Schema(
  {
    mainUser: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'mainUserModel',
      required: true,
    },

    mainUserModel: {
      type: String,
      required: true,
    },

    name: {
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

    role: {
      type: String,
      default: ROLE.BASIC_SUBUSER,
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

    isBulkDeleted: {
      type: Boolean,
      default: false,
    },

    initiatives: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Initiative',
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Hash plain text password
SubuserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// Password verification
SubuserSchema.methods.verifyPassword = async function (enteredPassword) {
  const verify = await bcrypt.compare(enteredPassword, this.password);
  return verify;
};

// Generate password reset token
SubuserSchema.methods.generatePasswordResetToken = function () {
  const token = generateOTP();
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return token;
};

const Subuser = mongoose.model('Subuser', SubuserSchema);
module.exports = Subuser;
