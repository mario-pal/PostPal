import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import argon2 from "argon2";
import { User } from "../entities/User";

import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid"; //the v4 function will give us a random string and we can use it as a token for...
import { getConnection } from "typeorm";
//...password resets via email to authenticate the password reset.

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[]; //the ? denotes a possible undefined value

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation (() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() {redisClient, req}: MyContext
  ): Promise<UserResponse>{
    if(newPassword.length <= 2){
        return { errors: [{
                field: 'newPassword',
                message: "length must be greater than 2"
            },]
        }
    }

    const key = FORGET_PASSWORD_PREFIX+token;
    const userId = await redisClient.get(key);
    if(!userId){
        return {
            errors: [
                {
                    field: "token",
                    message: "token expired"
                }
            ]
        };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if(!user){
        return{
            errors: [
                {
                    field: "token",
                    message: "user no longer exists"
                }
            ]
        }
    }

    await User.update({id: userIdNum }, {
      password: await argon2.hash(newPassword)
    });
    await redisClient.del(key);
    //log in user after change ion password
    req.session.userId = user.id;
    return {user};
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redisClient }: MyContext
  ) {
    const user = await User.findOne({where: {email}});
    if (!user) {
      //email i9s not in database
      return true; //this way you dpont tell the client, for security reasons
      //aka do nothing
    }

    const token = v4();
    await redisClient.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      100 * 60 * 60 * 24 * 3
    ); //expires after 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
    
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput, //this is another way to do argumments for graphql functions
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }
    const hashedPassword = await argon2.hash(options.password);
    /*const user = em.create(User, {
           username: options.username,
           password: hashedPassword 
        });*/
    let user;
    try {
      //User.create({}).save() see 5:47:00
      const result = await getConnection().createQueryBuilder().insert().into(User).values({
        username: options.username,
        email: options.email,
        password: hashedPassword
      }).returning('*').execute();
      user = result.raw[0];
      //await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
      //console.log("message: ", err.message);
    }

    //The line below will set a cookie on the user to keep them logged in after registering
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? {where: { email: usernameOrEmail }}
        : {where: { username: usernameOrEmail }}
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username does not exist",
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session!.userId = user.id;

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
