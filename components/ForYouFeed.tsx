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
        id="11111111-1111-1111-1111-111111111111"
        username="oshicappu"
        avatar="/avatars/banri.png"
        location="bed"
        images={["/posts/post1.png", "/posts/post2.jpg", "/posts/post1.png"]}
        caption={"sogo and abe-chan\nIn the city\nYour eyes on me now 時間は slowly\n(Oh, tic-tac, tic-tac)\nBackground music for love\n胸騒ぎな holiday, yeah, yeah"}
        likes={2599}
        comments={3}
        time="2 HOURS AGO"
        onCommentClick={() =>
          onCommentClick("11111111-1111-1111-1111-111111111111")
        }
        priority
        oshis={[
          {
            id: "1",
            name: "Banri",
            image: "/avatars/banri.png",
          },
          {
            id: "2",
            name: "Sogo",
            image: "/posts/post1.png",
          },
        ]}
        hashtags={[
          "idolish7",
          "anime",
          "oshikatsu",
          "banri",
        ]}
      />
    </div>
  );
}