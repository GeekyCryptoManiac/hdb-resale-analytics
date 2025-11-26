// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define a proper schema for comparison items
const comparisonItemSchema = new mongoose.Schema({
  transaction_id: { type: Number, required: true },
  block_number: String,
  street_name: String,
  flat_type_name: String,
  floor_area_sqm: Number,
  storey_range: String,
  town_name: String,
  town: String,
  month: String,
  price: Number,
  price_per_sqm: Number
}, { _id: false, strict: false }); // Allow additional fields but don't create _id

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // Store full property objects in comparison list
  comparisonList: {
    type: [comparisonItemSchema],
    default: [],
    // Ensure it's always an array
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: 'comparisonList must be an array'
    }
  },
  // 🆕 NEW TRACKING FIELDS
  searchHistory: [{
    query: mongoose.Schema.Types.Mixed,  // Flexible search criteria
    timestamp: { type: Date, default: Date.now },
    resultsCount: Number
  }],
  
  viewedProperties: [{
    transaction_id: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 1 }
  }],
  
  favorites: [{
    transaction_id: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now }
  }],
  
  preferences: {
    type: mongoose.Schema.Types.Mixed,  // Flexible user preferences
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Convert to JSON - hide password
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);