const mongoose = require("mongoose");

const districtSchema = new mongoose.Schema(
  {
    district_id: {
      type: Number,
      required: true,
    },
    city_id: {
      type: Number,
      required: true,
    },
    region_id: {
      type: Number,
      required: true,
    },
    name_ar: {
      type: String,
      required: true,
    },
    name_en: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true }
);
districtSchema.index({ city_id: 1 }, { unique: false });
districtSchema.index({ name_ar: 1 }, { unique: false });

module.exports = mongoose.model("District", districtSchema);
