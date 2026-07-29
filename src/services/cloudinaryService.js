async function uploadToCloudinary(file, resourceType = "image") {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("إعدادات Cloudinary غير مكتملة.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload?.secure_url) {
    throw new Error(payload?.error?.message || "فشل رفع الصورة.");
  }

  return payload.secure_url;
}

export function uploadImageToCloudinary(file) {
  return uploadToCloudinary(file, "image");
}

export function uploadFileToCloudinary(file) {
  return uploadToCloudinary(file, "raw");
}
