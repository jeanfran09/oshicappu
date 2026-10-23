"use client";

import {
  useEffect,
  useLayoutEffect,
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
  LoaderCircle,
  Reply as ReplyIcon,
  Send,
  User as UserIcon,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/components/SupabaseAuthContext";
import ConversationSkeleton from "@/components/Skeleton/ConversationSkeleton";

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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MESSAGE_PAGE_SIZE = 30;

function formatMessageTime(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMessageDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== today.getFullYear() && {
      year: "numeric",
    }),
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
  const userId = user?.id;

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
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [notAllowed, setNotAllowed] = useState(false);

  const [newMessageId, setNewMessageId] = useState<
    string | null
  >(null);

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

  const messagesContainerRef =
    useRef<HTMLDivElement>(null);

  const loadingOlderRef = useRef(false);

  const pendingScrollRef = useRef<{
    height: number;
    top: number;
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resizeTextarea() {
    const textarea = textareaRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      120
    )}px`;
  }

  // Load conversation.
  useEffect(() => {
    if (!userId || !conversationId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setMessages([]);
      setHasMoreMessages(true);
      loadingOlderRef.current = false;
      pendingScrollRef.current = null;

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
        (p: any) => p.user_id === userId
      );

      if (!isParticipant) {
        setNotAllowed(true);
        setLoading(false);
        return;
      }

      const other = participants.find(
        (p: any) => p.user_id !== userId
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
          .order("created_at", { ascending: false })
          .limit(MESSAGE_PAGE_SIZE);

      if (cancelled) return;

      if (messagesError) {
        console.error(
          "Error fetching messages:",
          messagesError
        );
      } else {
        const initialMessages = (messageRows ?? [])
          .reverse() as Message[];

        setMessages(initialMessages);
        setHasMoreMessages(
          initialMessages.length === MESSAGE_PAGE_SIZE
        );
      }

      setLoading(false);

      void supabase
        .from("conversation_participants")
        .update({
          last_read_at: new Date().toISOString(),
        })
        .eq("conversation_id", conversationId!)
        .eq("user_id", userId)
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
  }, [userId, conversationId]);

  async function loadOlderMessages() {
    if (
      !conversationId ||
      loadingOlderRef.current ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    const container = messagesContainerRef.current;
    const oldestMessage = messages[0];

    if (!container || !oldestMessage) return;

    loadingOlderRef.current = true;
    setLoadingOlder(true);

    // Capture the viewport before fetching. Apply this snapshot only
    // when older messages are actually prepended, avoiding interference
    // from live messages that may arrive while the request is pending.
    const previousScroll = {
      height: container.scrollHeight,
      top: container.scrollTop,
    };

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .lt("created_at", oldestMessage.created_at)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE_SIZE);

      if (error) throw error;

      const olderMessages = (data ?? []).reverse() as Message[];

      if (olderMessages.length < MESSAGE_PAGE_SIZE) {
        setHasMoreMessages(false);
      }

      if (olderMessages.length > 0) {
        pendingScrollRef.current = previousScroll;

        setMessages((currentMessages) => {
          const existingIds = new Set(
            currentMessages.map((message) => message.id)
          );

          const uniqueOlderMessages = olderMessages.filter(
            (message) => !existingIds.has(message.id)
          );

          if (uniqueOlderMessages.length === 0) {
            pendingScrollRef.current = null;
            return currentMessages;
          }

          return [...uniqueOlderMessages, ...currentMessages];
        });
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      pendingScrollRef.current = null;
      console.error("Error loading older messages:", error);
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }

  function handleMessagesScroll() {
    const container = messagesContainerRef.current;

    if (
      container &&
      container.scrollTop <= 40 &&
      hasMoreMessages &&
      !loadingOlderRef.current
    ) {
      void loadOlderMessages();
    }
  }

  // Keep the same messages in view after older messages are prepended.
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    const previousScroll = pendingScrollRef.current;

    if (!container || !previousScroll) return;

    container.scrollTop =
      previousScroll.top +
      (container.scrollHeight - previousScroll.height);

    pendingScrollRef.current = null;
  }, [messages]);

  // Live updates for new messages.
  useEffect(() => {
    if (!conversationId || !userId) return;

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
              prev.some((message) => message.id === incoming.id)
            ) {
              return prev;
            }

            setNewMessageId(incoming.id);

            return [...prev, incoming];
          });

          if (incoming.sender_id !== userId) {
            void supabase
              .from("conversation_participants")
              .update({
                last_read_at: new Date().toISOString(),
              })
              .eq("conversation_id", conversationId)
              .eq("user_id", userId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

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

  // Instantly position the conversation at the latest message
  // after the initial messages finish loading.
  useEffect(() => {
    if (loading || messages.length === 0) return;

    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "auto",
    });
  }, [loading]);

  // Scroll smoothly only when a new message is actually added.
  useEffect(() => {
    if (!newMessageId) return;

    const container = messagesContainerRef.current;

    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });
    }

    const timeout = setTimeout(() => {
      setNewMessageId(null);
    }, 250);

    return () => clearTimeout(timeout);
  }, [newMessageId]);

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
    const element = messageRefs.current[id];

    if (!element) return;

    element.scrollIntoView({
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
          if (prev.some((message) => message.id === data.id)) {
            return prev;
          }

          setNewMessageId(data.id);

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
          onClick={() => router.push("/messages")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        >
          <ChevronLeft size={22} />
        </button>

        {otherUser && (
          <Link
            href={`/${otherUser.username}`}
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
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="relative flex-1 space-y-2 overflow-y-auto px-3 py-4 pb-18"
      >
        {loadingOlder && !loading && (
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-center gap-2 bg-background/90 py-3">
            <LoaderCircle
              size={30}
              className="animate-spin text-foreground/50"
            />
          </div>
        )}

        {loading ? (
          <ConversationSkeleton />
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
                const message = messages[i];

                if (
                  message.sender_id === user?.id &&
                  new Date(message.created_at).getTime() <=
                    readAtTime
                ) {
                  lastSeenMessageId = message.id;
                  break;
                }
              }
            }

            const messagesById = new Map(
              messages.map((message) => [
                message.id,
                message,
              ])
            );

            return messages.map((message, index) => {
              const isMine = message.sender_id === user?.id;
              const messageDate = new Date(message.created_at);
              const previousMessage = messages[index - 1];
              const previousDate = previousMessage
                ? new Date(previousMessage.created_at)
                : null;

              const showDate =
                !previousDate ||
                messageDate.getFullYear() !== previousDate.getFullYear() ||
                messageDate.getMonth() !== previousDate.getMonth() ||
                messageDate.getDate() !== previousDate.getDate();

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
                  ref={(element) => {
                    messageRefs.current[message.id] =
                      element;
                  }}
                  className={
                    newMessageId === message.id
                      ? "animate-message-slide-up"
                      : ""
                  }
                >
                  {showDate && (
                    <div className="flex justify-center py-4">
                      <span className="px-3 py-1 text-xs text-foreground/75">
                        {formatMessageDate(message.created_at)}
                      </span>
                    </div>
                  )}

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
                              src={repliedMessage.image_url}
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
                      className={`max-w-[75%] select-none rounded-2xl ${
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

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              resizeTextarea();
            }}
            placeholder={
              replyingTo ? "Reply..." : "Message..."
            }
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

      {/* Backdrop */}
      {menuForMessageId && (
        <div
          className="fixed inset-0 z-[9000]"
          onClick={() => setMenuForMessageId(null)}
        />
      )}

      {/* Image viewer */}
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