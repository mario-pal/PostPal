import { MyContext } from "src/types";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";
import {EntityManager} from '@mikro-orm/postgresql';
import { COOKIE_NAME } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";

@ObjectType()
class FieldError{
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse{
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]; //the ? denotes a possible undefined value

    @Field(() => User, {nullable: true})
    user?: User;
}

@Resolver()
export class UserResolver {
    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() {em} : MyContext
    ){
        //const user = await em.findOne(User, {email});
        return true;
    }

    @Query(() => User, {nullable: true})
    async me(
        @Ctx() {req, em}: MyContext
    ){
        if(!req.session.userId){
            return null;
        }
        const user = await em.findOne(User, {id: req.session.userId});
        return user;
    }

    @Mutation (() => UserResponse)
    async register(
        @Arg("options") options: UsernamePasswordInput, //this is another way to do argumments for graphql functions
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse>{
        const errors  = validateRegister(options);
        if(errors){
            return {errors};
        }
        const hashedPassword = await argon2.hash(options.password);
        /*const user = em.create(User, {
           username: options.username,
           password: hashedPassword 
        });*/
        let user;
        try{
            const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert({
                username: options.username,
                password: hashedPassword,
                email: options.email,
                created_at: new Date(),//created_at and updated_at fields must be added since we're using Knex not mikro-orm for the query
                updated_at: new Date()//it is updated_at and not updatedAt because mikro-orm writes the column names with underscores
            })
            .returning("*");
            user = result[0];
            //await em.persistAndFlush(user);
        } catch(err){
            if(err.code === "23505"){
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken"
                        }
                    ]
                }
            }
            //console.log("message: ", err.message);
        }

        //The line below will set a cookie on the user to keep them logged in after registering
        req.session.userId = user.id;
        
        return {user};
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg("usernameOrEmail") usernameOrEmail: string,
        @Arg("password") password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, usernameOrEmail.includes('@') 
        ? {email: usernameOrEmail} : {username : usernameOrEmail});
        if(!user){
            return{
                errors: [{
                    field: 'usernameOrEmail',
                    message: "username does not exist"
                }]
            }
        }

        const valid = await argon2.verify(user.password, password);
        if(!valid){
                return {
                    errors: [
                        {
                            field: "password",
                            message: "incorrect password"
                        }
                    ]
                };
        }

        req.session!.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() {req, res}: MyContext){
       return new Promise((resolve) => req.session.destroy((err) => {
           res.clearCookie(COOKIE_NAME);
            if(err){
                resolve(false)
                return;
            }

            resolve(true);
        })
        );
    }
}