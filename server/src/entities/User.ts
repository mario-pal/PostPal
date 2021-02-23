import {BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Post } from "./Post";

//the @ are called decorators
//The @field tells graphql which fields you want to expose in your api implementation
@ObjectType()//this is here to turn classes into graphql types
@Entity()//each entity represents a database table
export class User extends BaseEntity{
    //Note: without the @Propety, the title! field,
    //for example, is not a database column. It just
    //becomes a field of this User class
    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)//for some fields you must explicitly set the graphql type like this
    @CreateDateColumn({type: "date"})
    createdAt: Date;
    
    @Field(() => String)
    @UpdateDateColumn()
    updatedAt: Date;
    //==============================
    @Field()
    @Column({unique: true})
    username!: string;

    @Field()
    @Column({unique: true})
    email!: string;

    @Column({type: 'text'})
    password!: string;

    @OneToMany(() => Post, post => post.creator)
    posts: Post[];
}