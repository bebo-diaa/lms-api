import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
          required: true
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
          required: true
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true },
);

progressSchema.index({ student: 1, lesson: 1 }, { unique: true });


const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
