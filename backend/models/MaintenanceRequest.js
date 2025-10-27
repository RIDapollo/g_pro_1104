const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
vehicleNumber: { type: String, required: true },
ownerAddress: { type: String, required: true },
requesterAddress: { type: String, required: true },
status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending'
},
createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);