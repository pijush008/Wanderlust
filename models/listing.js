const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  url: String,
  filename: String,
});

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    image: {
      type: imageSchema,
      default: {
        url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        filename: "default-image",
      },
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    geometry:{
type:{
type:String,
enum:["Point"],
required:true,
},
coordinates:{
type:[Number],
required:true,
},
    },
    // category:{
    //   type:String,
    //   enum:["mountains","arctic","farms",]

    // }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Listing", listingSchema);
