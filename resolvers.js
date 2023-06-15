import {quotes,users} from './fakedb.js'
import {randomBytes} from 'crypto'
import mongoose from 'mongoose'

import bcrypt from 'bcryptjs'

import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './config.js'



const User = mongoose.model("User")
const Quote = mongoose.model("Quote")

// Resolver
const resolvers = {
    Query :{
        // users : () => users,
        // // First param is Parent in this case its undefined
        // user:(_,args)=> users.find(user=>user._id == args._id),
        // quotes : () => quotes,
        // iquote:(_,{by})=> quotes.filter(quote=>quote.by==by),

        users:async () => await User.find({}),
        user:async (_,{_id})=> await User.findOne({_id}),
        //quotes:async ()=>await Quote.find({}).populate("by","_id firstName"),
        //quotes:async ()=>await Quote.find({}),
        quotes:async ()=>await Quote.find({}).populate("by","_id firstName"),
        iquote:async (_,{by})=> await Quote.find({by})
    },
    User:{
        //quotes: (ur) => quotes.filter(quote => quote.by == ur._id)
        quotes:async (ur)=> await Quote.find({by:ur._id})
    },
    // Not a good way
    // Mutation:{
    //     signupUserDummy:(_,{firstName,lastName,email,password}) =>{
    //         const id = randomBytes(5).toString("hex")
    //         users.push({
    //             id,firstName,lastName,email,password
    //         })
    //         return users.find(user=>user.id == id)
    //     }
    // }

    // Mutation:{
    //     signupUserDummy:(_,{userNew}) =>{
    //         const _id = randomBytes(5).toString("hex")
    //         users.push({
    //             _id,
    //             ...userNew
    //         })
    //         return users.find(user=>user._id == _id)
    //     }
    // }


    Mutation:{
        signupUser: async (_,{userNew}) =>{
          const user = await User.findOne({email:userNew.email})
          if(user){
            throw new Error("User already exist in the database")
          }
          const hashedPassword =  await bcrypt.hash(userNew.password,12) 

          const newUser = new User({
            ...userNew,
            password:hashedPassword
          })
          return await newUser.save()
        },


        signinUser: async (_,{userSignin}) =>{
            const user = await User.findOne({email:userSignin.email})
            if(!user){
                throw new Error("User does not exist in the database")
            }

            // Password Compare
            const doMatch = await bcrypt.compare(userSignin.password,user.password)
            if(!doMatch){
                throw new Error("Invalid Password or Email")
            }
            const token = jwt.sign({userId:userSignin._id},JWT_SECRET)
            return {token}
        },

        // Protected Resource a user has to login to create a new quote
        createQuote:async (_,{name},{userId})=>{
            if(!userId) throw new Error("You must be logged in")
            const newQuote = new Quote({
                name,
                by:userId
            })
            await newQuote.save()
            return "Quote saved successfully"
         },


    }

}

export default resolvers