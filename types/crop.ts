export type CropData = {
  crop: {
    x: number;
    y: number;
  };
  zoom: number;
  croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};