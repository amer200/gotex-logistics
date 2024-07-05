const fs = require("fs");

// Read the JSON file
const data = JSON.parse(
  fs.readFileSync("/root/logsitics/gotex-logistics/districts.json")
  fs.readFileSync("/root/logsitics/gotex-logistics/districts.json", "utf8")
);

// Connect to the database and insert the data
use("logistics");
db.districts.insertMany(data);