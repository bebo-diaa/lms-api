import mongoose from "mongoose";

import { enrollmentStatus } from "../utils/enrollmentStatus.js";

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(enrollmentStatus),
      default: enrollmentStatus.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

enrollmentSchema.index(
  { student: 1, course: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: enrollmentStatus.SUCCESS,
    },
  },
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
