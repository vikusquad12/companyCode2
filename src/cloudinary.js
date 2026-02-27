import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME === "dtb4daxv4",
    api_key: process.env.CLOUDINARY_API_KEY === "631488333164418",
    api_secret: process.env.CLOUDINARY_API_SECRET === "1fFujJuqTmcMVUB8JnNRf62N_n8"
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "profile_pics",
        allowed_formats: ["jpg", "png", "jpeg"],
        transformation: [{ width: 300, height: 300, crop: "fill" }]
    }
});

export { cloudinary, storage };