import Divider from "./Divider"
import Post from "./Post"

export default function ForYouFeed(){
    return(
        <div>
            <Post
                username="oshicappu"
                avatar="/avatars/banri.png"
                location="bed"
                image="/posts/post1.png"
                caption="sogo"
                likes={2599}
                comments={3}
                time="2 HOURS AGO"
            />
        </div>
    )
}