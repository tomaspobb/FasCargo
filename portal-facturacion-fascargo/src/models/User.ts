import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  userId: { type: String, unique: true, sparse: true }, // para QR
  email: { type: String, unique: true, sparse: true }, // opcional para login normal
  passwordHash: { type: String },
  secret2FA: { type: String, required: true },
});

export const User = models.User || model('User', UserSchema);
