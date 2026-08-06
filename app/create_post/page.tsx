"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

import ImagePreview from "@/components/CreatePost/ImagePreview";
import ThumbnailStrip from "@/components/CreatePost/ThumbnailStrip";
import CaptionInput from "@/components/CreatePost/CaptionInput";
import PostButton from "@/components/CreatePost/PostButton";
import ImageCropper from "@/components/CreatePost/ImageCropper";
import TagInput from "@/components/CreatePost/TagInput";
import OshiPicker from "@/components/CreatePost/OshiPicker";
import BottomSheet from "@/components/BottomSheet";

type CropData = {
  crop: {
    x: number;
    y: number;
  };
  zoom: number;
};


export default function CreatePostPage() {

  const MAX_IMAGES = 10;

  const [images, setImages] = useState<File[]>([]);
  const [originalImages, setOriginalImages] = useState<File[]>([]);
  const [cropData, setCropData] = useState<CropData[]>([]);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [cropImage, setCropImage] = useState<string | null>(null);
  // final image array index
  const [cropIndex, setCropIndex] = useState(0);
  // upload queue index
  const [pendingIndex, setPendingIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [hashtags, setHashtags] = useState<string[]>([]);
  const [fandoms, setFandoms] = useState<string[]>([]);

  const [selectedOshis, setSelectedOshis] = useState<string[]>([]);
  const [showBottomSheet, setShowBottomSheet] = useState(false);//temp

  //TODO: change to db oshis 
  const oshis = [
    {
      id: "1",
      name: "sogo",
      image: "/posts/post1.png",
    },
    {
      id: "2",
      name: "abe-chan",
      image: "/posts/post2.jpg",
    },
  ];

  const {
    user,
    isLoggedIn,
    isLoading
  } = useSupabaseAuth();
  
  const router = useRouter();

  if (!isLoading && !isLoggedIn) {
    router.push("/login");
    return null;
  }

  const canPost = caption.trim().length > 0 || !loading;

  function handleSelectImages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(e.target.files ?? []);

    if (!selected.length) {
      return;
    }

    const remaining = MAX_IMAGES - originalImages.length;


    if (remaining <= 0) {
      setMessage("You can only upload up to 10 photos");

      setTimeout(() => {
        setMessage("");
      }, 2500);

      e.target.value = "";
      return;
    }


    if (selected.length > remaining) {
      setMessage(
        `You can only select ${remaining} more photo${remaining === 1 ? "" : "s"}`
      );

      setTimeout(() => {
        setMessage("");
      }, 2500);

      e.target.value = "";
      return;
    }


    // Accept images
    const startIndex = originalImages.length;


    setOriginalImages(prev => [
      ...prev,
      ...selected
    ]);


    setPendingImages(selected);


    setCropIndex(startIndex);


    setCropImage(
      URL.createObjectURL(selected[0])
    );


    e.target.value = "";
  }


  function handleEditImage() {
    const original = originalImages[currentIndex];

    if (!original)
      return;

    setPendingImages([]);
    setPendingIndex(0);
    setCropIndex(currentIndex);
    setCropImage(
      URL.createObjectURL(original)
    );

  }

  function handleCropComplete(
    croppedFile: File
  ) {
    setImages(prev => {
      const updated =
        [...prev];
      // Replace existing image
      if (cropIndex < updated.length) {
        updated[cropIndex] =
          croppedFile;
      }

      // Add new image
      else {
        updated.push(croppedFile);
      }

      return updated;
    });

    const nextPending =
      pendingIndex + 1;

    // Continue cropping selected images
    if (
      nextPending < pendingImages.length
    ) {
      setPendingIndex(nextPending);
      setCropIndex(prev =>
        prev + 1
      );
      setCropImage(
        URL.createObjectURL(
          pendingImages[nextPending]
        )
      );
    }

    else {
      setCropImage(null);
      setPendingImages([]);
      setPendingIndex(0);
    }

  }

  function cancelCrop() {
    setCropImage(null);
    setPendingImages([]);
    setPendingIndex(0);

  }

  async function handleSubmit() {
    setError("");
    
    if (!user) {

      setError(
        "You must be logged in to create a post"
      );

      return;
    }

    if (!canPost) {

      setError(
        "Post cannot be empty"
      );

      return;
    }
    setLoading(true);
    try {
      const {
        error: insertError
      } =
        await supabase
          .from("posts")
          .insert({

            user_id:user.id,

            content:
              caption.trim(),

          });

      if(insertError){

        setError(
          insertError.message
        );

        return;

      }

      setImages([]);

      setOriginalImages([]);

      setCropData([]);

      setCaption("");

      setCurrentIndex(0);

      router.push("/profile");
    } catch {
      setError(
        "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

  if(isLoading){
    return (
      <div className="
        md:hidden
        min-h-screen
        flex
        items-center
        justify-center
      ">
        Loading...
      </div>
    );
  }

  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {cropImage && (
        <ImageCropper
          image={cropImage}
          aspectRatio={aspectRatio}

          isFirstImage={
            images.length === 0
          }

          initialCrop={
            cropData[cropIndex]
          }

          onCropChange={(data)=>{
            setCropData(prev=>{
              const updated =
                [...prev];
              updated[cropIndex] =
                data;
              return updated;
            });
          }}

          onRatioChange={
            setAspectRatio
          }

          onComplete={
            handleCropComplete
          }

          onCancel={
            cancelCrop
          }
        />

      )}
      {message && (
        <div
          className="
            fixed
            top-20
            left-1/2
            -translate-x-1/2
            z-[200]
            rounded-full
            bg-black/50
            px-4
            py-3
            text-sm
            text-white
            text-center
            whitespace-nowrap
            shadow-lg
          "
        >
          {message}
        </div>
      )}
      <header
        className="
          sticky
          top-0
          z-50
          flex
          items-center
          justify-between
          px-4
          pt-4
          pb-3
          bg-background
          border-b
          border-foreground/30
        "
      >
        <h1 className="text-2xl">
          Create Post
        </h1>

        <button
          onClick={() => router.push("/")}
          className="
            h-10
            w-10
            rounded-full
            bg-accent/50
            flex
            items-center
            justify-center
          "
        >
          <X size={20}/>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mt-4">
          <div className="space-y-4 pb-4">
            <ImagePreview
            images={images}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            onEdit={handleEditImage}
            aspectRatio={aspectRatio}
            />

            <ThumbnailStrip
              images={images}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              setImages={setImages}
              onSelectImages={handleSelectImages}
            />
          </div>

          <CaptionInput
            caption={caption}
            setCaption={setCaption}
          />

          <TagInput
            label="Hashtags"
            placeholder="Add a hashtag"
            items={hashtags}
            setItems={setHashtags}
            maxItems={10}
            prefix="#"
          />

          <TagInput
            label="Fandoms"
            placeholder="Add a fandom"
            items={fandoms}
            setItems={setFandoms}
            maxItems={5}
          />
          <OshiPicker
            oshis={oshis}
            selected={selectedOshis}
            setSelected={setSelectedOshis}
            onAdd={() => setShowBottomSheet(true)}
          />

          {showBottomSheet && (
            <BottomSheet
              title="Add Oshi"
              onClose={() => setShowBottomSheet(false)}
            >
              add form
            </BottomSheet>
          )}

          {error && (
            <div className="
              rounded-xl
              border
              border-red-500
              bg-red-500/10
              p-3
            ">
              <p className="
                text-sm
                text-red-500
              ">
                {error}
              </p>
            </div>
          )}
        </div>
      </main>

      {!cropImage && (

        <PostButton

          disabled={!canPost}

          loading={loading}

          onClick={handleSubmit}

        />
      )}
    </div>
  );
}