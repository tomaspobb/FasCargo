// ✅ src/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    secret2FA: { type: String, required: true },
    email: { type: String, required: false }, // ← solo opcional
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
  },
  {
    timestamps: false
  }
);

export const User = models.User || model('User', UserSchema);
