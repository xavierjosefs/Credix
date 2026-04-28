import { randomUUID } from "crypto";
import { supabase } from "../utils/supabase.js";

const BUCKET_NAME = "client-profiles";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

export const uploadProfileImage = async (file: Express.Multer.File): Promise<string> => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("Only JPEG and PNG images are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image size must be 2MB or less");
  }

  const fileExtension = getFileExtension(file.mimetype);
  const fileName = `clients/${Date.now()}-${randomUUID()}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error uploading profile image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  if (!data.publicUrl) {
    throw new Error("Error generating profile image URL");
  }

  return data.publicUrl;
};

function getFileExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    default:
      throw new Error("Unsupported file type");
  }
}
