export const loadCrossOriginImage = (src) =>
  new Promise((success, failure) => {
    let img = new window.Image();
    img.crossOrigin = "true";
    img.onload = () => success(img);
    img.onabort = img.onerror = failure;
    img.src = src;
  });
