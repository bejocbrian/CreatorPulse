import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  creator_type: 'individual' | 'business';
  currency: string;
  payout_region: string;
  google_id?: string;
  avatar?: string;
  is_verified: boolean;
  verification_token?: string;
  verification_expires?: Date;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    creator_type: {
      type: String,
      enum: ['individual', 'business'],
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    payout_region: {
      type: String,
      required: true,
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verification_token: {
      type: String,
    },
    verification_expires: {
      type: Date,
    },
    reset_password_token: {
      type: String,
    },
    reset_password_expires: {
      type: Date,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ google_id: 1 });
UserSchema.index({ verification_token: 1 });
UserSchema.index({ reset_password_token: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
