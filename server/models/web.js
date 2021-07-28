const { Schema, model } = require("mongoose");

const webSchema = new Schema(
  {
    url: {
      type: String,
    },
    type: {
      type: String,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    created_at: {
      type: Date,
      default: Date.now(),
    },
    updated_at: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const Web = model("Web", webSchema);

module.exports = Web;
