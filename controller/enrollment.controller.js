import asyncWrapper from "../middleware/asyncWrapper.js";

import Enrollment from "../model/enrollment.model.js";

import { httpStatusText } from "../utils/httpStatusText.js";

import { getPaginationParams } from "../utils/pagination.js";

const getMyEnrollments = asyncWrapper(async (req, res, next) => {
  const { page, limit, skip } = getPaginationParams(req.query);

  const user = req.currentUser.id;

  const [myCourses, totalEnrollments] = await Promise.all([
    Enrollment.find({ student: user })
      .populate("course")
      .skip(skip)
      .limit(limit),

    Enrollment.countDocuments({ student: user }),
  ]);

  const totalPages = Math.ceil(totalEnrollments / limit);

  res.json({
    status: httpStatusText.SUCCESS,
    data: {
      enrollments: myCourses,
      pagination: { page, limit, totalEnrollments, totalPages },
    },
  });
});

export { getMyEnrollments };