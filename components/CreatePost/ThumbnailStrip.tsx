"use client";

import Image from "next/image";
import { X, Plus } from "lucide-react";
import { useEffect, useState } from "react";

type ThumbnailStripProps = {
  images: File[];
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  onSelectImages: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};


export default function ThumbnailStrip({
  images,
  currentIndex,
  setCurrentIndex,
  setImages,
  onSelectImages,
}: ThumbnailStripProps) {


  const [urls, setUrls] = useState<string[]>([]);

  const MAX_IMAGES = 10;



  useEffect(() => {

    const newUrls =
      images.map((file) =>
        URL.createObjectURL(file)
      );


    setUrls(newUrls);



    return () => {

      newUrls.forEach((url) =>
        URL.revokeObjectURL(url)
      );

    };


  }, [images]);






  function removeImage(index:number) {


    setImages(prev => {

      const updated =
        prev.filter(
          (_,i)=>i !== index
        );


      return updated;

    });



    setCurrentIndex(prev => {

      if(prev > index)
        return prev - 1;


      if(prev === index)
        return Math.max(
          0,
          prev - 1
        );


      return prev;

    });

  }

  return (

    <div className="flex overflow-x-">
      {images.map((file,index)=>(
        <button
          key={index}
          type="button"
          onClick={() =>
            setCurrentIndex(index)
          }
          className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2
            ${
              currentIndex === index
              ? "border-foreground"
              : "border-transparent"
            }
          `}

        >
          {urls[index] && (

            <Image
              src={urls[index]}
              alt={`Image ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
          )}

          <span
            onClick={(e)=>{
              e.stopPropagation();
              removeImage(index);
            }}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X size={12}/>
          </span>
        </button>
      ))}

      {images.length < MAX_IMAGES && (

        <label
          className="
            flex
            h-20
            w-20
            flex-shrink-0
            cursor-pointer
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            border-accent
          "
        >
          <Plus size={24}  className="text-foreground/75"/>
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e)=>{

              onSelectImages(e);

              // allow selecting same images again
              e.target.value = "";

            }}
          />
        </label>
      )}
    </div>
  );
}