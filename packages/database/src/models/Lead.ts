import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ILead extends Document {
  name?: string;
  email?: string;
  source: string;
  createdAt: Date;
}

const LeadSchema: Schema = new Schema({
  name: { type: String },
  email: { type: String },
  source: { type: String, default: 'quiz-end-popup' },
}, { timestamps: true });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
