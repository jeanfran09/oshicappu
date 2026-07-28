import Divider from "./Divider"
import Post from "./Post"

export default function FollowingFeed(){
    return(
        <div>
            <Post
                username="oshicappu"
                avatar="/avatars/banri.png"
                location="bed"
                image="/posts/post1.png"
                caption="sogo"
                likes={2543}
                comments={3}
                time="2 HOURS AGO"
            />
            <Divider/>
            <Post
                username="oshicappu"
                avatar="/avatars/banri.png"
                image="/posts/post2.jpg"
                caption="あざとい"
                time="2 HOURS AGO"
            />
        </div>

    )
}