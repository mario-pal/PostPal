import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
//the @ are called decorators
//The @field tells graphql which fields you want to expose in your api implementation
@ObjectType()//this is here to turn classes into graphql types
@Entity()//each entity represents a database table
export class User{
    //Note: without the @Propety, the title! field,
    //for example, is not a database column. It just
    //becomes a field of this User class
    @Field(() => Int)
    @PrimaryKey()
    id!: number;

    @Field(() => String)//for some fields you must explicitly set the graphql type like this
    @Property({type: "date"})
    createdAt = new Date();
    
    @Field(() => String)
    @Property({ type: "date", onUpdate: () => new Date() })
    updatedAt = new Date();

    @Field()
    @Property({type: 'text', unique: true})
    username!: string;

    @Field()
    @Property({type: 'text', unique: true})
    email!: string;

    @Property({type: 'text'})
    password!: string;
}