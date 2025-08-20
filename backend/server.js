import express from 'express'
import dotenv from 'dotenv'
import { generate } from './chatbot.js'
import cors from 'cors'
dotenv.config()

const port = 3001

const app = express()
app.use(express.json())
app.use(cors())

app.post('/chat',async(req,res)=>{
    const {message} = req.body
    console.log("Message",message)

    const result = await generate(message)
    res.json({message:result})
})

app.listen(port,()=>{
    console.log(`Server is running at ${port}`)
})