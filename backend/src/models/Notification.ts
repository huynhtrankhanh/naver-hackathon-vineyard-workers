import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: string;
    message: string;
    meta?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);