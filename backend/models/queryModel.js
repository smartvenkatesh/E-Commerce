import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },  // 'user' or 'admin'
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const querySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppUser' },
  userName: String,
  queryText: String,
  isResolved: { type: Boolean, default: false },
  messages: [messageSchema], 
  createdAt: { type: Date, default: Date.now }
   
},
{timestamps:true});

export const Query = mongoose.model("Query", querySchema);