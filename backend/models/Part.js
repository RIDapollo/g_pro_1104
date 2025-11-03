const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partId: { // 부품 종류 (예: 엔진 - 흡기계)
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  registrationDate: {
    type: Date,
    required: true,
  },
  serialNumber: { // 고유 일련번호
    type: String,
    required: true,
    unique: true,
  },
  qrCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Part', partSchema);
