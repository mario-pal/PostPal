import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Resolver, Query, Ctx } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])//Post is the graphql type
    posts(
        @Ctx() {em}: MyContext
    ) : Promise<Post []> { //Promise<Post []> is the typescript type. Btw this is here to validate the return type.
        return em.find(Post, {});
    }
}