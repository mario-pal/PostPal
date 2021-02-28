import { Post } from "../entities/Post";
import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Int,
  Mutation,
  Field,
  InputType,
  UseMiddleware,
  Args,
  FieldResolver,
  Root,
  ObjectType,
} from "type-graphql";
import { MyContext } from "src/types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Upvote } from "../entities/Upvote";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post) //Post is passed in as an argument here to make the @FieldResolver work
export class PostResolver {
  //=======================================================
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice();
  }

  @FieldResolver(() =>User)
  creator(
    @Root() post: Post,
    @Ctx() {userLoader}: MyContext
    ){
    //return User.findOne(post.creatorId);
    //see 11:21:00
    //the point of this is to fetch all users in a single query for the main page instead of using multiple queries
    return userLoader.load(post.creatorId);//this returns a promise of a user (resolves to a user)
  }
  
  @FieldResolver(() => Int, {nullable: true})
  async voteStatus(
    @Root() post: Post,
    @Ctx() {upvoteLoader, req}: MyContext
  ){
    if(!req.session.userId){
      return null;
    }
    const upvote = await upvoteLoader.load({postId: post.id, userId: req.session.userId});

    return upvote ? upvote.value : null;
  }
  //=====================================================
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpvote = value !== -1;
    const realValue = isUpvote ? 1 : -1;
    const { userId } = req.session;
    const upvote = await Upvote.findOne({ where: { postId, userId } });
    //the user has voted on the post before and they are changing their vote
    if (upvote && upvote.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    update upvote
    set value = $1
    where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!upvote) {
      //has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
    insert into upvote ("userId", "postId", value)
    values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
    update post
    set points = points + $1
    where id = $2
      `,
          [realValue, postId]
        );
      });
    }
    return true;
    /*await Upvote.insert({
      userId,
      postId,
      value: realValue
    });*/
  }

  @Query(() => PaginatedPosts) //Post is the graphql type
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, //nullable because there is no cursor on first request
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    //Promise<Post []> is the typescript type. Btw this is here to validate the return type.
    const realLimit = Math.min(50, limit); //+ 1;// trick to let you peek ahead to see if there are more posts to fetch
    const realLimitPlusOne = realLimit + 1;
    //select p.* from post p means you want to reference the post table and select all the fields
    const replacements: any[] = [realLimitPlusOne]; //this might be null

    /*if (req.session.userId) {
      replacements.push(req.session.userId);
    }*/

    //let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      //cursorIdx = replacements.length; //note replacements.length is not zero based
    }

    //in postgres, there can be multiple schemas inside the database. So public.user...
    //...can help resolve table conflicts,
    //see 8:15:00
    //json_build_object is used to format the data the way graphql expects
    //see 9:42:00
    //json_build_object('id', u.id, 'username', u.username, 'email', u.email) creator,
    // inner join public.user u on u.id = p."creatorId"
    /*${
      req.session.userId
        ? '(select value from upvote where "userId" = $2 and "postId" = p.id) "voteStatus"'
        : 'null as "voteStatus"'
    }*/
    const posts = await getConnection().query(
      `
        select p.*
        
        
       

        from post p
       
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
    `,
      replacements
    );

    /*const qb = getConnection()
      .getRepository(Post)
      .createQueryBuilder("p") //p is an alius for Post entity
      .innerJoinAndSelect("p.creator", "u", 'u.id = p."creatorId"')//"" is there since postgres automatically transforms it to creator_id but we dont want that?
      .orderBy('p."createdAt"', "DESC")
      .take(realLimitPlusOne);*/
    /*if (cursor) {
      qb.where('p."createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }*/
    //return qb.getMany();//this executes the sql after setting up the settings
    //const posts = await qb.getMany();
    return {
      posts: posts.slice(0, realLimit),
      hasMore: this.posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true }) //this is saying we return a Post or Null graphql types
  post(
    //note: if you dont specify () => Int for id:number, typegraphql will assume it is type float
    @Arg("id", () => Int) id: number //here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
  ): Promise<Post | undefined> {
    //this is a type check done by Typescript
    //return Post.findOne(id, { relations: ["creator"] });
    return Post.findOne(id);
  }
  //mutation is for inserting, updating and deleting or other commands that change things on the server
  @Mutation(() => Post) //this is saying we return a Post or Null graphql types
  @UseMiddleware(isAuth) //this will run before the resolver
  async createPost(
    //@Arg('title', () => String) can be ommitted since graphql can sometimes infer the type from typescript
    @Arg("input") input: PostInput, //here instead of 'id' you can call this anything but youd have to use the selected name in the graphql query
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    //this is a type check done by Typescript

    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post, { nullable: true }) //nullable is added in case the post being updated doesnt exist
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string, //nullable implies the argument is optional, but when it is optional you must specify the type with ()=>typegoeshere
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    //this is a type check done by Typescript
    /*const post = await Post.findOne(id);
    if (!post) {
      return null;
    }*/
    /*if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }*/
    //return /*await*/ Post.update({id, creatorId: req.session.userId }, {title, text}); we cant simply return the...
    //... updated post and so we must use the query builder
    //return post;
    const result = await getConnection()//this is typeorm
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {//typeorm allows for passing paramters like this...but when doing raw sql you need to use $1, $2, etc...
        id,
        creatorId: req.session.userId,
      })
      .returning("*")//this will return the updated post
      .execute();

    return result.raw[0];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // this is the not cascade way to delete posts since they are tied to the upvotes
    // const post = await Post.findOne(id);
    // if (!post) {
    //   return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //   throw new Error("not authorized");
    // }

    // await Updoot.delete({ postId: id });
    // await Post.delete({ id });

    await Post.delete({ id, creatorId: req.session.userId });
    return true;
  }
}
