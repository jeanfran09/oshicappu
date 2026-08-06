import Divider from "./Divider"
import Post from "./Post"

type Props = {
  onCommentClick: (postId: string) => void;
};

export default function FollowingFeed({
  onCommentClick,
}: Props) {

    return(
        <div>
            <Post
                id="1"
                username="oshicappu"
                avatar="/avatars/banri.png"
                location="bed"
                images={["/posts/post1.png"]}
                caption="sogo"
                likes={2543}
                comments={3}
                time="2 HOURS AGO"
                onCommentClick={() => onCommentClick("1")}
            />
            <Divider/>
            <Post
                id="2"
                username="oshicappu"
                avatar="/avatars/banri.png"
                images={["/posts/post2.jpg"]}
                likes={1000000}
                caption="あざとい"
                time="2 HOURS AGO"
                onCommentClick={() => onCommentClick("1")}
            />
        </div>

    );
}