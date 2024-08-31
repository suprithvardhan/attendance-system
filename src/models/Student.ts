import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true,
    unique: true,
  },
  faceDescriptor: {
    type: [Number],
    required: true,
  },
});

export default mongoose.models.Student || mongoose.model('Student', StudentSchema);