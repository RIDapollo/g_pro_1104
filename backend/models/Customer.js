const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  userId: { // User 모델의 ObjectId
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: { // User의 username
    type: String,
    required: true
  },
  registeredBy: { // 등록한 주체 (예: 보험사 ID)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 등록한 주체도 User 모델을 참조한다고 가정
    required: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Customer', customerSchema);