import cloudinary from "../config/cloudinary";

export const isBase64Image = (value: string): boolean =>
  value.startsWith("data:image/");

export const isRemoteUrl = (value: string): boolean =>
  value.startsWith("http://") || value.startsWith("https://");

export const uploadImageToCloudinary = async (image: string): Promise<string> => {
  if (isRemoteUrl(image)) return image;
  if (!isBase64Image(image)) return image;

  const result = await cloudinary.uploader.upload(image, {
    folder: "sl-police-alert/alerts",
    resource_type: "image",
  });

  return result.secure_url;
};

export const deleteImageFromCloudinary = async (image: string): Promise<void> => {
  if (!isRemoteUrl(image)) return;

  try {
    const publicId = image.split("/").slice(-2).join("/").replace(/\.[^.]+$/, "");
    if (publicId.startsWith("sl-police-alert/")) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
  }
};