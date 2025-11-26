// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
}, { _id: false, strict: false });

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
  
  // ✅ Existing comparison list
  comparisonList: {
    type: [comparisonItemSchema],
    default: [],
    validate: {
      validator: function(v) {
        return Array.isArray(v);
      },
      message: 'comparisonList must be an array'
    }
  },
  
  // 🆕 NEW: Property view tracking
  viewedProperties: {
    type: [{
      transaction_id: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      viewCount: { type: Number, default: 1 }
    }],
    default: []
  },
  
  // 🆕 NEW: Search history tracking
  searchHistory: {
    type: [{
      query: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now },
      resultsCount: Number
    }],
    default: []
  },
  
  // 🆕 NEW: Favorites
  favorites: {
    type: [{
      transaction_id: { type: Number, required: true },
      addedAt: { type: Date, default: Date.now }
    }],
    default: []
  },
  
  // 🆕 NEW: User preferences
  preferences: {
    type: mongoose.Schema.Types.Mixed,
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