import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'admin'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const supportChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AppUser', required: true },
  messages: [messageSchema]
});

export const SupportChat = mongoose.model('SupportChat', supportChatSchema);