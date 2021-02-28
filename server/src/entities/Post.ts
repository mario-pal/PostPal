

import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Upvote } from "./Upvote";
import { User } from "./User";
//the @ are called decorators
//The @field tells graphql which fields you want to expose in your api implementation
@ObjectType()//this is here to turn classes into graphql types
@Entity()
export class Post extends BaseEntity{
    //Note: without the @Propety, the title! field,
    //for example, is not a database column. It just
    //becomes a field of this Post class
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)//for some fields you must explicitly set the graphql type like this
    @CreateDateColumn()
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
    //==============================
    @Field()
    @Column()
    title!: string;

    @Field()
    @Column()
    text!: string;

    @Field()
    @Column({type: "int", default: 0})
    points!: number;
    //
    @Field(() => Int, {nullable: true})
    voteStatus: number | null;
    //
    @Field()
    @Column()
    creatorId: number;

    @Field()
    @ManyToOne(() => User, user => user.posts)
    creator: User;
    //=====================================
    @OneToMany(() => Upvote, (upvote) => upvote.user)
    upvotes: Upvote[];
}
