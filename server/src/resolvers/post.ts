import { Post } from "../entities/Post";
import { MyContext } from "src/types";
import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";

@Resolver()
export class PostResolver {
    @Query(() => [Post])//Post is the graphql type
    posts(
        @Ctx() {em}: MyContext
    ) : Promise<Post []> { //Promise<Post []> is the typescript type. Btw this is here to validate the return type.
        return em.find(Post, {});
    }

    @Query(() => Post, {nullable: true})//this is saying we return a Post or Null graphql types
    post(
        @Arg('id', () => Int) id: number,//here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
        @Ctx() { em }: MyContext
    ) : Promise<Post | null>{ //this is a type check done by Typescript
        return em.findOne(Post, { id });
    }
    //mutation is for inserting, updating and deleting or other commands that change things on the server
    @Mutation(() => Post)//this is saying we return a Post or Null graphql types
    async createPost(//@Arg('title', () => String) can be ommitted since graphql can sometimes infer the type from typescript
        @Arg('title') title: string,//here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
        @Ctx() { em }: MyContext
    ) : Promise<Post>{ //this is a type check done by Typescript
        const post = em.create(Post, {title})
        await em.persistAndFlush(post)
        return post
    }

    @Mutation(() => Post, {nullable: true})//nullable is added in case the post being updated doesnt exist
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, {nullable: true}) title: string,//nullable implies the argument is optional, but when it is optional you must specify the type with ()=>typegoeshere
        @Ctx() { em }: MyContext
    ) : Promise<Post | null>{ //this is a type check done by Typescript
        const post = await em.findOne(Post, {id});
        if(!post){
            return null
        }
        if(typeof title !== 'undefined'){
            post.title = title;
            await em.persistAndFlush(post);
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number,
        @Ctx() { em }: MyContext
    ) : Promise<boolean>{
        await em.nativeDelete(Post, {id});
        return true
    }

}