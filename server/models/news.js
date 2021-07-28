const { Schema, model } = require("mongoose");

const newsSchema = new Schema(
  {
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    summary: {
      type: String,
    },
    images_url: {
      type: String,
    },
    author_name: {
      type: String,
    },
    topic: {
      type: String,
    },
    published_at: { type: Date, default: Date.now() },

    content_url: {
      type: String,
      unique: true,
      index: true,
    },
    content_type: {},
    domain_icon_url: { type: String },
    domain: { type: String },
    slug: { type: String },
    tag: [
      {
        type: String,
      },
    ],
    reading_time: { type: Number },
    status: { type: String, default: "public" },
    fetch_from_internet: { type: Boolean, default: true },
    meta_title: { type: String },
    meta_description: { type: String },
    created_at: {
      type: Date,
      default: Date.now(),
    },
    updated_at: {
      type: Date,
      default: Date.now(),
    },
    meta_tag: [
      {
        type: String,
      },
    ],
    is_approved: { type: Boolean, default: true },
  },

  {
    timestamps: true,
  },

  {
    autoIndex: false,
  }
);

const News = model("news", newsSchema, "news");

module.exports = News;
