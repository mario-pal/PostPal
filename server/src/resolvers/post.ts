import { Post } from "../entities/Post";
import { Resolver, Query, Ctx, Arg, Int, Mutation, Field, InputType, UseMiddleware } from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";

@InputType()
class PostInput{
    @Field()
    title: string
    @Field()
    text: string
}

@Resolver()
export class PostResolver {
    @Query(() => [Post])//Post is the graphql type
    async posts() : Promise<Post []> { //Promise<Post []> is the typescript type. Btw this is here to validate the return type.
        return Post.find();
    }

    @Query(() => Post, {nullable: true})//this is saying we return a Post or Null graphql types
    post(
        @Arg('id') id: number,//here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
    ) : Promise<Post | undefined>{ //this is a type check done by Typescript
        return Post.findOne(id);
    }
    //mutation is for inserting, updating and deleting or other commands that change things on the server
    @Mutation(() => Post)//this is saying we return a Post or Null graphql types
    @UseMiddleware(isAuth)//this will run before the resolver
    async createPost(//@Arg('title', () => String) can be ommitted since graphql can sometimes infer the type from typescript
        @Arg("input") input: PostInput,//here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
        @Ctx() {req}: MyContext    
        ) : Promise<Post>{ //this is a type check done by Typescript
        
        return Post.create({
            ...input,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Post, {nullable: true})//nullable is added in case the post being updated doesnt exist
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, {nullable: true}) title: string,//nullable implies the argument is optional, but when it is optional you must specify the type with ()=>typegoeshere
    ) : Promise<Post | null>{ //this is a type check done by Typescript
        const post = await Post.findOne(id);
        if(!post){
            return null
        }
        if(typeof title !== 'undefined'){
            await Post.update({id}, {title});
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number,
    ) : Promise<boolean>{
        await Post.delete(id);
        return true;
    }

}