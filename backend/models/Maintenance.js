const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
  },
  odometer: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  partInfo: {
    type: Object,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  transactionHash: {
    type: String,
    required: false, 
  }
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);

/**/
