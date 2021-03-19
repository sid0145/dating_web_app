const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  facebook: {
    type: String,
  },
  firstname: { type: String },
  lastname: { type: String },
  fullname: { type: String },
  password: {
    type: String,
  },
  image: {
    type: String,
    default: "../public/assets/defaultImage.jpg",
  },
  email: {
    type: String,
  },
  city: {
    type: String,
  },
  country: {
    type: String,
  },
  online: {
    type: Boolean,
    default: false,
  },
  wallet: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("User", userSchema);
