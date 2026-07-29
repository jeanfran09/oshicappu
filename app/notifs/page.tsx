"use client";

import Divider from "@/components/Divider";
import Notification from "@/components/Notification";
import PullToRefresh from "@/components/PullToRefresh";

async function refreshNotifs() {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // fetch notifs here
}

export default function NotifsPage() {
  return (
    <main>
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background">
        <h1 className="text-xl font-bold px-4 py-3">
          Notifications
        </h1>
        <Divider/>
      </header>
      <PullToRefresh onRefresh={refreshNotifs}> 
        {/* Like notification */}
        <Notification
          type="like"
          username="yuna"
          avatar="/avatars/banri.png"
          image="/posts/post2.jpg"
          time="5 minutes ago"
        />
        <Divider/>
        {/* Comment notification */}
        <Notification
          type="comment"
          username="haru"
          avatar="/avatars/banri.png"
          content="This performance was amazing! 💖"
          image="/posts/post2.jpg"
          time="10 minutes ago"
        />
        <Divider/>
        {/* Follow notification */}
        <Notification
          type="follow"
          username="mika"
          avatar="/avatars/banri.png"
          time="1 hour ago"
        />
        <Divider/>
        {/* Like notification */}
        <Notification
          type="like"
          username="yuna"
          avatar="/avatars/banri.png"
          image="/posts/post2.jpg"
          time="5 minutes ago"
        />
        <Divider/>
        {/* Comment notification */}
        <Notification
          type="comment"
          username="haru"
          avatar="/avatars/banri.png"
          content="This performance was amazing! 💖"
          image="/posts/post2.jpg"
          time="10 minutes ago"
        />
        <Divider/>
        {/* Follow notification */}
        <Notification
          type="follow"
          username="mika"
          avatar="/avatars/banri.png"
          time="1 hour ago"
        />
        <Divider/>
        {/* Like notification */}
        <Notification
          type="like"
          username="yuna"
          avatar="/avatars/banri.png"
          image="/posts/post2.jpg"
          time="5 minutes ago"
        />
        <Divider/>
        {/* Comment notification */}
        <Notification
          type="comment"
          username="haru"
          avatar="/avatars/banri.png"
          content="This performance was amazing! 💖"
          image="/posts/post2.jpg"
          time="10 minutes ago"
        />
        <Divider/>
        {/* Follow notification */}
        <Notification
          type="follow"
          username="mika"
          avatar="/avatars/banri.png"
          time="1 hour ago"
        />
      </PullToRefresh>
    </main>    
  );
}