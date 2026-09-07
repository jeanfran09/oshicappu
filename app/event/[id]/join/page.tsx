"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [socialMedia, setSocialMedia] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save registration to Supabase here
    console.log({
      eventId: params.id,
      email,
      name,
      contactNumber,
      socialMedia,
    });

    router.push(`/event/${params.id}`);
  };

  return (
    <div className="min-h-screen bg-background md:hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center border-b border-foreground/10 bg-background py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold">
          Join Event
        </h1>
      </header>

      <main className="px-4 pb-24 pt-6">
        <h2 className="text-xl font-bold">
          Sign up for this event
        </h2>

        <p className="mt-1 text-sm text-foreground/60">
          Enter your information to register for the event.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-foreground/10
                bg-background
                px-4
                py-3
                text-sm
                outline-none
                focus:border-accent-secondary
              "
            />
          </div>

          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium"
            >
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-foreground/10
                bg-background
                px-4
                py-3
                text-sm
                outline-none
                focus:border-accent-secondary
              "
            />
          </div>

          {/* Contact Number */}
          <div>
            <label
              htmlFor="contactNumber"
              className="text-sm font-medium"
            >
              Contact Number
            </label>

            <input
              id="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) =>
                setContactNumber(e.target.value)
              }
              placeholder="09XX XXX XXXX"
              required
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-foreground/10
                bg-background
                px-4
                py-3
                text-sm
                outline-none
                focus:border-accent-secondary
              "
            />
          </div>

          {/* Social Media Link */}
          <div>
            <label
              htmlFor="socialMedia"
              className="text-sm font-medium"
            >
              Social Media Link
              <span className="ml-1 text-foreground/40">
                (optional)
              </span>
            </label>

            <input
              id="socialMedia"
              type="url"
              value={socialMedia}
              onChange={(e) =>
                setSocialMedia(e.target.value)
              }
              placeholder="https://instagram.com/username"
              className="
                mt-2
                w-full
                rounded-xl
                border
                border-foreground/10
                bg-background
                px-4
                py-3
                text-sm
                outline-none
                focus:border-accent-secondary
              "
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="
              mt-2
              w-full
              rounded-full
              bg-accent
              py-3
              text-sm
              font-semibold
            "
          >
            Confirm Registration
          </button>
        </form>
      </main>
    </div>
  );
}