const { Schema, model } = require("mongoose");

const credentialSchema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
      trim: true,
      required: true,
    },
    username: {
      type: String,
      minlength: 5,
      unique: true,
    },
    password: {
      type: String,
      minlength: 3,
      required: true,
    },
    phone: {
      type: String,
    },
    age: {
      type: Number,
    },
    address: {
      type: String,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    photo: {
      type: String,
    },
    package: {
      type: String,
    },

    education: { type: String },
    doctorType: { type: String },

    gender: {
      type: String,
    },

    district: {
      type: String,
    },

    area: {
      type: String,
    },
    join: {
      type: Date,
    },

    checkSum: {
      type: String,
    },

    role: {
      type: String,
      default: "user",
    },
    passwordResetLink: {
      data: String,
      default: "",
    },
    created_at: {
      type: Date,
    },
    updated_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Credential = model("Credential", credentialSchema, "credential");

module.exports = Credential;
