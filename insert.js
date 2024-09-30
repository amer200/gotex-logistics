const fs = require("fs");

// Read the JSON file
const data = JSON.parse(
  fs.readFileSync("/root/logsitics-p/gotex-logistics/districts.json", "utf8")
);

// Connect to the database and insert the data
use("logistics-p");
db.districts.insertMany(data);
