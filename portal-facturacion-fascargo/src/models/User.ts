import mongoose, { Schema, model, models } from 'mongoose';

// Evita redefinir el modelo si ya existe
if (!models.User) {
  const UserSchema = new Schema({
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    secret2FA: {
      type: String,
      default: null, // Se genera después del login si se activa 2FA
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  }, {
    timestamps: true,
  });

  // Creamos el modelo solo si no existe
  mongoose.model('User', UserSchema);
}

// Exportamos el modelo ya creado o existente
export const User = models.User as mongoose.Model<any>;
