const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  partId: {
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
  qrCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 수정: 모델을 exports할 때 바로 사용 가능한 형태로 변경
const Part = mongoose.model('Part', partSchema);

module.exports = Part;