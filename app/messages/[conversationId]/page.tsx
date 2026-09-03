"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ImagePlus,
  Send,
  User as UserIcon,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";

type OtherParticipant = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSupabaseAuth();

  const conversationId =
    typeof params.conversationId === "string"
      ? params.conversationId
      : null;

  const [otherUser, setOtherUser] =
    useState<OtherParticipant | null>(null);

  // Timestamp of the last message the other participant has
  // read (their conversation_participants.last_read_at), used
  // to render "Seen" under the most recent message they've read.
  const [otherReadAt, setOtherReadAt] = useState<
    string | null
  >(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const [attachedFile, setAttachedFile] =
    useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<
    string | null
  >(null);
  const [attachError, setAttachError] = useState("");

  const [viewingImage, setViewingImage] = useState<
    string | null
  >(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load the other participant + message history, verify
  // access, and mark the conversation as read.
  useEffect(() => {
    if (!user || !conversationId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);

      const { data: participants, error: participantsError } =
        await supabase
          .from("conversation_participants")
          .select(
            "user_id, last_read_at, profiles!conversation_participants_user_id_fkey(id, username, display_name, avatar_url)"
          )
          .eq("conversation_id", conversationId!);

      if (cancelled) return;

      if (participantsError || !participants) {
        console.error(
          "Error fetching conversation participants:",
          participantsError
        );
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      const isParticipant = participants.some(
        (p: any) => p.user_id === user!.id
      );

      if (!isParticipant) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      const other = participants.find(
        (p: any) => p.user_id !== user!.id
      );

      if (other) {
        const otherProfile: any = Array.isArray(
          other.profiles
        )
          ? other.profiles[0]
          : other.profiles;

        setOtherUser({
          id: other.user_id,
          username: otherProfile?.username ?? "user",
          display_name:
            otherProfile?.display_name ?? "User",
          avatar_url: otherProfile?.avatar_url ?? null,
        });

        setOtherReadAt(other.last_read_at ?? null);
      }

      const { data: messageRows, error: messagesError } =
        await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId!)
          .order("created_at", { ascending: true });

      if (cancelled) return;

      if (messagesError) {
        console.error(
          "Error fetching messages:",
          messagesError
        );
      } else {
        setMessages(messageRows ?? []);
      }

      setLoading(false);

      // Mark as read now that the messages have loaded.
      void supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId!)
        .eq("user_id", user!.id)
        .then(({ error }) => {
          if (error) {
            console.error(
              "Error marking conversation as read:",
              error
            );
          }
        });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user, conversationId]);

  // Live updates for new messages in this conversation.
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;

          setMessages((prev) => {
            if (
              prev.some((m) => m.id === incoming.id)
            ) {
              return prev;
            }
            return [...prev, incoming];
          });

          // If the incoming message is from the other
          // person and we're actively viewing this
          // conversation, mark it read right away.
          if (incoming.sender_id !== user.id) {
            void supabase
              .from("conversation_participants")
              .update({
                last_read_at: new Date().toISOString(),
              })
              .eq("conversation_id", conversationId)
              .eq("user_id", user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  // Live updates for the other participant's read state, so
  // "Seen" appears without needing to reload the page.
  useEffect(() => {
    if (!conversationId || !otherUser) return;

    const channel = supabase
      .channel(`read-receipts:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as {
            user_id: string;
            last_read_at: string | null;
          };

          if (updated.user_id === otherUser.id) {
            setOtherReadAt(updated.last_read_at);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, otherUser]);

  // Keep the view scrolled to the latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  // Clean up the object URL used for the attachment preview.
  useEffect(() => {
    return () => {
      if (attachedPreview) {
        URL.revokeObjectURL(attachedPreview);
      }
    };
  }, [attachedPreview]);

  function handleFileSelect(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    setAttachError("");

    if (!file.type.startsWith("image/")) {
      setAttachError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setAttachError("Images must be under 10MB.");
      return;
    }

    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
    }

    setAttachedFile(file);
    setAttachedPreview(URL.createObjectURL(file));
  }

  function clearAttachment() {
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
    }
    setAttachedFile(null);
    setAttachedPreview(null);
    setAttachError("");
  }

  async function uploadImageFile(
    file: File,
    userId: string,
    convoId: string
  ): Promise<string> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${convoId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("messages")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || `image/${ext}`,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("messages").getPublicUrl(path);

    return publicUrl;
  }

  async function handleSend() {
    const content = draft.trim();

    if (
      (!content && !attachedFile) ||
      !user ||
      !conversationId ||
      sending
    ) {
      return;
    }

    setSending(true);

    const previousDraft = draft;
    const previousFile = attachedFile;

    setDraft("");
    clearAttachment();

    try {
      let imageUrl: string | null = null;

      if (previousFile) {
        imageUrl = await uploadImageFile(
          previousFile,
          user.id,
          conversationId
        );
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || null,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) {
            return prev;
          }
          return [...prev, data as Message];
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setDraft(previousDraft);

      if (previousFile) {
        setAttachedFile(previousFile);
        setAttachedPreview(
          URL.createObjectURL(previousFile)
        );
      }
    } finally {
      setSending(false);
    }
  }

  if (notAllowed) {
    return (
      <div className="md:hidden flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-foreground/50">
          You don't have access to this conversation.
        </p>

        <button
          onClick={() => router.replace("/messages")}
          className="text-sm font-medium"
        >
          Back to messages
        </button>
      </div>
    );
  }

  return (
    <div className="md:hidden flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-2 border-b border-foreground/10 bg-background px-2 py-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        {otherUser && (
          <Link
            href={`/profile/${otherUser.username}`}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-accent">
              {otherUser.avatar_url ? (
                <Image
                  src={otherUser.avatar_url}
                  alt={otherUser.username}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <UserIcon
                    size={16}
                    className="text-foreground/30"
                  />
                </div>
              )}
            </div>

            <span className="truncate text-base font-semibold">
              {otherUser.display_name ||
                otherUser.username}
            </span>
          </Link>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4 pb-24">
        {loading ? (
          <p className="p-4 text-center text-sm text-foreground/40">
            Loading...
          </p>
        ) : messages.length === 0 ? (
          <p className="p-4 text-center text-sm text-foreground/40">
            No messages yet. Say hi 👋
          </p>
        ) : (
          (() => {
            // Find the most recent message I sent that the
            // other participant has read, so we only show a
            // single "Seen" label (like most chat apps) rather
            // than repeating it on every message.
            let lastSeenMessageId: string | null = null;

            if (otherReadAt) {
              const readAtTime = new Date(
                otherReadAt
              ).getTime();

              for (let i = messages.length - 1; i >= 0; i--) {
                const m = messages[i];
                if (
                  m.sender_id === user?.id &&
                  new Date(m.created_at).getTime() <=
                    readAtTime
                ) {
                  lastSeenMessageId = m.id;
                  break;
                }
              }
            }

            return messages.map((message) => {
              const isMine = message.sender_id === user?.id;
              const showSeen =
                isMine &&
                message.id === lastSeenMessageId;

              return (
                <div key={message.id}>
                  <div
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-1.5 pb-1 pt-1.5 ${
                        isMine
                          ? "bg-accent"
                          : "bg-accent/40"
                      } ${
                        message.image_url ? "" : "px-3.5"
                      }`}
                    >
                      {message.image_url && (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingImage(
                              message.image_url as string
                            )
                          }
                          className="relative mb-1 block w-full overflow-hidden rounded-xl"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={message.image_url}
                            alt="Sent attachment"
                            className="max-h-72 w-full object-cover"
                          />
                        </button>
                      )}

                      {message.content && (
                        <p
                          className={`whitespace-pre-line break-words text-[15px] ${
                            message.image_url
                              ? "px-2"
                              : ""
                          }`}
                        >
                          {message.content}
                        </p>
                      )}

                      <p
                        className={`mt-0.5 text-right text-[10px] text-foreground/70 ${
                          message.image_url ? "px-2" : ""
                        }`}
                      >
                        {formatMessageTime(
                          message.created_at
                        )}
                      </p>
                    </div>
                  </div>

                  {showSeen && (
                    <p className="mt-1 text-right text-[11px] text-foreground/40">
                      Seen
                    </p>
                  )}
                </div>
              );
            });
          })()
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-foreground/10 bg-background p-3">
        {attachedPreview && (
          <div className="mb-2 flex items-center gap-2">
            <div className="relative h-16 w-16 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachedPreview}
                alt="Attachment preview"
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={clearAttachment}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {attachError && (
          <p className="mb-2 text-xs text-red-500">
            {attachError}
          </p>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/50"
            aria-label="Attach an image"
          >
            <ImagePlus size={20} />
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message..."
            className="h-11 flex-1 rounded-full border border-foreground/20 bg-transparent px-4 text-base outline-none"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={
              (!draft.trim() && !attachedFile) || sending
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Full-screen image viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90"
          onClick={() => setViewingImage(null)}
        >
          <button
            type="button"
            onClick={() => setViewingImage(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
          >
            <X size={20} className="text-white" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingImage}
            alt="Attachment"
            className="max-h-[85vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </div>
  );
}