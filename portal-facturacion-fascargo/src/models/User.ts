// ✅ src/models/User.ts
import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    secret2FA: { type: String }, // ← se añade después del setup
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model('User', UserSchema);
