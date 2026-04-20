require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("ERROR: MONGO_URI is not defined in .env");
  process.exit(1);
}

// Mask password for safety
const maskedUri = uri.replace(/:([^@]+)@/, ":********@");
console.log(`Attempting to connect with URI: ${maskedUri}`);

mongoose.connect(uri)
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("FAILURE: Connection failed!");
    console.error(`Error Name: ${err.name}`);
    console.error(`Error Message: ${err.message}`);
    if (err.message.includes('Authentication failed')) {
      console.log("\nTIP: The credentials (username or password) are incorrect for this cluster.");
    }
    process.exit(1);
  });
