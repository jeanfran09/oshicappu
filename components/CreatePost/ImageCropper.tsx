"use client";

import { useState } from "react";
import Cropper, { Area } from "react-easy-crop";


type Props = {
  image: string;
  aspectRatio: number;
  isFirstImage: boolean;

  initialCrop?: {
    crop: {
      x: number;
      y: number;
    };
    zoom: number;
  };

  onCropChange: (data: {
    crop: {
      x: number;
      y: number;
    };
    zoom: number;
  }) => void;

  onRatioChange: (ratio: number) => void;

  onComplete: (file: File) => void;
  onCancel: () => void;
};



export default function ImageCropper({
  image,
  aspectRatio,
  initialCrop,
  onCropChange,
  onComplete,
  onCancel,
}: Props) {


  const [crop, setCrop] = useState(
    initialCrop?.crop ?? {
      x: 0,
      y: 0,
    }
  );


  const [zoom, setZoom] = useState(
    initialCrop?.zoom ?? 1
  );


  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<Area | null>(null);



  function handleCropChange(
    newCrop: {
      x:number;
      y:number;
    }
  ) {

    setCrop(newCrop);

    onCropChange({
      crop: newCrop,
      zoom,
    });

  }



  function handleZoomChange(
    newZoom:number
  ) {

    setZoom(newZoom);

    onCropChange({
      crop,
      zoom:newZoom,
    });

  }



  function onCropComplete(
    _: Area,
    pixels: Area
  ) {
    setCroppedAreaPixels(pixels);
  }




  async function createCroppedImage(){

    if(!croppedAreaPixels)
      return;


    const canvas =
      document.createElement("canvas");


    const imageElement =
      document.createElement("img");


    imageElement.src=image;


    await new Promise((resolve)=>{
      imageElement.onload=resolve;
    });



    const {
      width,
      height,
      x,
      y
    } = croppedAreaPixels;



    canvas.width=width;
    canvas.height=height;


    const ctx =
      canvas.getContext("2d");


    if(!ctx)
      return;


    ctx.drawImage(
      imageElement,
      x,
      y,
      width,
      height,
      0,
      0,
      width,
      height
    );



    canvas.toBlob(blob=>{

      if(!blob)
        return;


      const file =
        new File(
          [blob],
          `cropped-${Date.now()}.jpg`,
          {
            type:"image/jpeg"
          }
        );


      onComplete(file);


    },"image/jpeg");

  }



  return (

    <div 
      data-cropper
      className="fixed inset-0 z-[10000] bg-black"
      style={{
        touchAction: "none",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >


      <Cropper
        image={image}
        crop={crop}
        zoom={zoom}

        aspect={aspectRatio}

        cropShape="rect"
        showGrid={true}

        minZoom={1}
        maxZoom={3}

        zoomWithScroll={false}
        restrictPosition={true}

        onCropChange={handleCropChange}
        onZoomChange={handleZoomChange}
        onCropComplete={onCropComplete}
      />



      <div className="
        absolute
        bottom-6
        left-0
        right-0
        flex
        justify-center
        gap-4
      ">

        <button
          onClick={onCancel}
          className="
            rounded-full
            bg-white/20
            px-6
            py-3
            text-white
          "
        >
          Cancel
        </button>



        <button
          onClick={createCroppedImage}
          className="
            rounded-full
            bg-white
            px-6
            py-3
            text-black
          "
        >
          Done
        </button>


      </div>


    </div>

  );
}