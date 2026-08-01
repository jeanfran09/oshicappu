import CreatePostButton from "@/components/CreatePostButton";

export default function SearchPage() {
  return (
    <main className="p-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search users, posts, or hashtags..."
        className="w-full rounded-full border border-gray-300 bg-white px-4 py-3 outline-none focus:border-accent focus:ring-2 focus:ring-accent"
      />

      {/* Placeholder */}
      <div className="mt-10 flex flex-col items-center text-center">
        <p className="text-lg font-semibold">
          Start searching
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Find users, fandoms, events, and posts.
        </p>
      </div>
      
      <CreatePostButton />
    </main>
  );
}