const fs = require("fs");

// Read the JSON file
const data = JSON.parse(
  fs.readFileSync("/root/logsitics/gotex-logistics/districts.json")
);

// Connect to the database and insert the data
use("logistics");
db.districts.insertMany(data);
