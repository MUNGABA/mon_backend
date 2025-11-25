export default function optimizeImage(url, size = 200) {
  if (!url) return null;

  // Si image Cloudinary → on utilise le resize Cloudinary
  if (url.includes("res.cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${size},h_${size},c_fill/`);
  }

  // Sinon on renvoie l'image originale
  return url;
}
