import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    secret2FA: { type: String, required: true },
    email: { type: String, required: false }, // 🆕 Campo opcional de email
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date } // se actualiza solo al verificar token
  },
  {
    timestamps: false // desactiva updatedAt automático, usamos lastLogin manual
  }
);

export const User = models.User || model('User', UserSchema);
