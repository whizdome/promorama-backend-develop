const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema(
  {
    inviteId: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      required: true,
    },

    emails: [
      {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  },
);

InviteSchema.index({ createdAt: 1 }, { expires: '3d' });

const Invite = mongoose.model('Invite', InviteSchema);
module.exports = Invite;
