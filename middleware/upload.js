import multer from "multer";
import cloudinary from "../utils/cloudinary.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lms-videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi"],
  },
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const upload = multer({ storage: storage });

export default upload;
