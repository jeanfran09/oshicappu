import Divider from "./Divider"
import Post from "./Post"

type Props = {
  onCommentClick: (postId: string) => void;
};

export default function ForYouFeed({
  onCommentClick,
}: Props) {

  return (
    <div>
      <Post
        id="1"
        username="oshicappu"
        avatar="/avatars/banri.png"
        location="bed"
        image="/posts/post1.png"
        caption="sogo"
        likes={2599}
        comments={3}
        time="2 HOURS AGO"
        onCommentClick={() =>
          onCommentClick("1")
        }
      />
    </div>
  );
}