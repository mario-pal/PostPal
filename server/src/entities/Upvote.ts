import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Post } from "./Post";
import { User } from "./User";
//here we want to set up a many to many relationship
//user <-> posts
//several users can upvote the same post
//users can also upvote many other posts
//user -> join table (aka Upvotes)<- Post-+

@ObjectType()
@Entity()
export class Upvote extends BaseEntity {
  @Column({type: "int"})
  value: number;
  
  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => User, (user) => user.upvotes)
  user: User;
  //=====

  @PrimaryColumn()
  postId: number;

  @ManyToOne(() => Post, (post) => post.upvotes, {//10:37:00
    onDelete: "CASCADE", //If a post is deleted, it will also delete the upvotes
  })
  post: Post;
  //==============
  
}
