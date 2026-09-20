import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    required: true,
    maxlength: 200,
  },
}, {
  timestamps: true,
});

reviewSchema.index({ user: 1, course: 1}, {unique: true});

const Review = mongoose.model("Review", reviewSchema);

export default Review;