const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log('connected to DB');
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  // FIXED VERSION
  initData.data = initData.data.map((obj) => {
    return {
      ...obj,
      owner: "6939868f9fce4aa8fe0243c4", // replace with your user ID
    };
  });

  await Listing.insertMany(initData.data);
  console.log('data is added');
};

initDB();
