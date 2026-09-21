import multer from "multer";
import cloudinary from "../utils/cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "lms-videos",
    resource_type: "video",
    allowed_formats: ["mp4", "mov", "avi"],
  },
});

const upload = multer({storage: storage});

export default upload;
