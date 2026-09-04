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
  Reply as ReplyIcon,
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
  reply_to_id: string | null;
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

function replyPreviewText(message: Message) {
  if (message.content) return message.content;
  if (message.image_url) return "📷 Photo";
  return "";
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

  const [replyingTo, setReplyingTo] = useState<Message | null>(
    null
  );

  const [highlightedId, setHighlightedId] = useState<
    string | null
  >(null);

  const [menuForMessageId, setMenuForMessageId] = useState<
    string | null
  >(null);

  const messageRefs = useRef<
    Record<string, HTMLDivElement | null>
  >({});

  const longPressTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const pressStart = useRef<{ x: number; y: number } | null>(
    null
  );

  const didLongPress = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Message textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize message textarea
  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      120
    )}px`;
  }

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

  // Live updates for the other participant's read state.
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

  // Clean up attachment preview URL.
  useEffect(() => {
    return () => {
      if (attachedPreview) {
        URL.revokeObjectURL(attachedPreview);
      }
    };
  }, [attachedPreview]);

  // Clean up long-press timer.
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

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

  function scrollToMessage(id: string) {
    const el = messageRefs.current[id];

    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedId(id);

    setTimeout(() => {
      setHighlightedId((current) =>
        current === id ? null : current
      );
    }, 1500);
  }

  const LONG_PRESS_MS = 450;
  const MOVE_CANCEL_PX = 10;

  function handlePressStart(
    messageId: string,
    x: number,
    y: number
  ) {
    pressStart.current = { x, y };
    didLongPress.current = false;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setMenuForMessageId(messageId);
    }, LONG_PRESS_MS);
  }

  function handlePressMove(x: number, y: number) {
    if (!pressStart.current || !longPressTimer.current) {
      return;
    }

    const dx = x - pressStart.current.x;
    const dy = y - pressStart.current.y;

    if (
      Math.sqrt(dx * dx + dy * dy) > MOVE_CANCEL_PX
    ) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePressEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
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
    } = supabase.storage
      .from("messages")
      .getPublicUrl(path);

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
    const previousReplyTo = replyingTo;

    setDraft("");

    // Reset textarea height after clearing the draft.
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });

    clearAttachment();
    setReplyingTo(null);

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
          reply_to_id: previousReplyTo?.id ?? null,
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

      requestAnimationFrame(() => {
        resizeTextarea();
      });

      if (previousFile) {
        setAttachedFile(previousFile);
        setAttachedPreview(
          URL.createObjectURL(previousFile)
        );
      }

      if (previousReplyTo) {
        setReplyingTo(previousReplyTo);
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
    <div className="md:hidden flex h-screen flex-col overflow-hidden">
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

            const messagesById = new Map(
              messages.map((m) => [m.id, m])
            );

            return messages.map((message) => {
              const isMine = message.sender_id === user?.id;

              const showSeen =
                isMine &&
                message.id === lastSeenMessageId;

              const repliedMessage = message.reply_to_id
                ? messagesById.get(message.reply_to_id)
                : null;

              const otherName =
                otherUser?.display_name ||
                otherUser?.username ||
                "them";

              const replyHeaderText = repliedMessage
                ? isMine
                  ? repliedMessage.sender_id === user?.id
                    ? "You replied to yourself"
                    : `Replied to ${otherName}`
                  : repliedMessage.sender_id ===
                    message.sender_id
                  ? `${otherName} replied to themself`
                  : "Replied to you"
                : null;

              const isHighlighted =
                highlightedId === message.id;

              const isImageOnly =
                !!message.image_url && !message.content;

              const menuOpen =
                menuForMessageId === message.id;

              return (
                <div
                  key={message.id}
                  ref={(el) => {
                    messageRefs.current[message.id] = el;
                  }}
                >
                  {repliedMessage && (
                    <div
                      className={`mb-1 flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          scrollToMessage(
                            repliedMessage.id
                          )
                        }
                        className={`flex flex-col gap-1 ${
                          isMine
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-xs text-foreground/50">
                          <ReplyIcon size={12} />
                          <span>{replyHeaderText}</span>
                        </span>

                        {repliedMessage.image_url && (
                          <span
                            className={`flex items-center gap-1.5 ${
                              isMine
                                ? "flex-row-reverse"
                                : ""
                            }`}
                          >
                            <span className="h-16 w-[3px] shrink-0 rounded-full bg-foreground/25" />

                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                repliedMessage.image_url
                              }
                              alt="Replied-to attachment"
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          </span>
                        )}
                      </button>
                    </div>
                  )}

                  {repliedMessage &&
                    !repliedMessage.image_url && (
                      <div
                        className={`flex ${
                          isMine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div className="mb-1 max-w-[75%] truncate rounded-2xl bg-foreground/10 px-3 py-1.5 text-xs text-foreground/60">
                          {replyPreviewText(
                            repliedMessage
                          )}
                        </div>
                      </div>
                    )}

                  <div
                    className={`flex items-center gap-1 ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      onPointerDown={(e) =>
                        handlePressStart(
                          message.id,
                          e.clientX,
                          e.clientY
                        )
                      }
                      onPointerMove={(e) =>
                        handlePressMove(
                          e.clientX,
                          e.clientY
                        )
                      }
                      onPointerUp={handlePressEnd}
                      onPointerLeave={handlePressEnd}
                      onPointerCancel={handlePressEnd}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenuForMessageId(message.id);
                      }}
                      className={`max-w-[75%] select-none rounded-2xl transition-colors duration-500 ${
                        isImageOnly
                          ? ""
                          : `${
                              isMine
                                ? "bg-accent"
                                : "bg-accent/40"
                            } px-1.5 pb-1 pt-1.5 ${
                              message.image_url
                                ? ""
                                : "px-3.5"
                            }`
                      } ${
                        isHighlighted
                          ? "ring-2 ring-accent-secondary"
                          : ""
                      }`}
                    >
                      {message.image_url && (
                        <button
                          type="button"
                          onClick={() => {
                            if (didLongPress.current) {
                              didLongPress.current = false;
                              return;
                            }

                            setViewingImage(
                              message.image_url as string
                            );
                          }}
                          className={`relative block w-full overflow-hidden rounded-2xl ${
                            isImageOnly ? "" : "mb-1"
                          }`}
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

                      {!isImageOnly && (
                        <p
                          className={`mt-0.5 text-right text-[10px] text-foreground/70 ${
                            message.image_url
                              ? "px-2"
                              : ""
                          }`}
                        >
                          {formatMessageTime(
                            message.created_at
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {menuOpen && (
                    <div
                      className={`relative z-[9500] mt-1 flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="flex items-center gap-1 rounded-xl border border-foreground/10 bg-background px-1 py-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(message);
                            setMenuForMessageId(null);
                          }}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium"
                        >
                          <ReplyIcon size={14} />
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

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
        {replyingTo && (
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-foreground/5 px-3 py-2">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-foreground/10">
              {replyingTo.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={replyingTo.image_url}
                  alt="Replied-to attachment"
                  className="h-full w-full object-cover"
                />
              ) : (
                <ReplyIcon
                  size={22}
                  className="text-foreground/50"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                Replying to{" "}
                {replyingTo.sender_id === user?.id
                  ? "yourself"
                  : otherUser?.display_name ||
                    otherUser?.username ||
                    "them"}
              </p>

              <p className="truncate text-sm text-foreground/50">
                {replyingTo.image_url
                  ? "Photo"
                  : replyingTo.content}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/10"
              aria-label="Cancel reply"
            >
              <X size={14} />
            </button>
          </div>
        )}

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

        <div className="flex items-end gap-2">
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

          {/* Message Input */}
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              resizeTextarea();
            }}
            placeholder={replyingTo ? "Reply" : "Message"}
            rows={1}
            className="
              min-h-[44px]
              max-h-[120px]
              flex-1
              resize-none
              overflow-y-auto
              rounded-2xl
              border
              border-foreground/20
              bg-transparent
              px-4
              py-2.5
              text-base
              leading-5
              outline-none
              no-scrollbar
            "
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
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

      {/* Backdrop to dismiss the message action popup */}
      {menuForMessageId && (
        <div
          className="fixed inset-0 z-[9000]"
          onClick={() => setMenuForMessageId(null)}
        />
      )}

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