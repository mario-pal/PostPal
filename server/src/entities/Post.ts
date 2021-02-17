import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, Int, ObjectType } from "type-graphql";
//the @ are called decorators
//The @field tells graphql which fields you want to expose in your api implementation
@ObjectType()//this is here to turn classes into graphql types
@Entity()
export class Post{
    //Note: without the @Propety, the title! field,
    //for example, is not a database column. It just
    //becomes a field of this Post class
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
    @Property({type: 'text'})
    title!: string;
}