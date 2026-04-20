const mongoose = require('mongoose');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const testConnection = (uri) => {
  console.log(`\nTesting connection...`);
  mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log("✅ SUCCESS: Connected successfully!");
      console.log("\nCopy this EXACT URI to your .env file:");
      console.log(uri);
      process.exit(0);
    })
    .catch(err => {
      console.log("❌ FAILURE: " + err.message);
      ask();
    });
};

const ask = () => {
  rl.question('\nEnter your MongoDB Username: ', (user) => {
    rl.question('Enter your MongoDB Password: ', (pass) => {
        rl.question('Enter your Cluster (e.g. cluster0.pslx0yb.mongodb.net): ', (cluster) => {
            const uri = `mongodb+srv://${user}:${encodeURIComponent(pass)}@${cluster}/?retryWrites=true&w=majority`;
            testConnection(uri);
        });
    });
  });
};

console.log("--- MongoDB Credential Tester ---");
ask();
