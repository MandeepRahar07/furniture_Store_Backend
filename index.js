const express = require("express");
const cors = require("cors");
const serverless = require('serverless-http')
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { connection } = require("./config/db");
const Product = require('./model/Products');
const {UserModel} = require('./model/user')
dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(cors({
  origin : "*"
}))
app.use(express.json());

//......................authentication at here......................................


const authentication = (req,res,next)=>{
  const token = req.headers.authorization?.split(" ")[1];
  if(!token){
      res.send("log in first")
  }
  else{
      jwt.verify(token, "mandeep",function(err,decode){
               if(err){
                  res.send("login first")
               }
               else{
                const {userID} = decode;
                req.userID= userID;
                  next()
               }
      })
  }
}

//..............................signup at here...................................................


app.post("/sign_up", async(req,res)=>{
  const {name, email, password,phone} = req.body;
  bcrypt.hash(password, process.env.BCRYPT_KEY,async function(err, hash) {
if(err){
 res.send({ msg :"some worong gose, please recheck"});

}
else{
 const data = await  UserModel.create({
   email,
   password : hash,
   name
 })
 res.send(data);
}

 });
try{

}catch(err){
 console.log("something  wrong", err);
}
})

//...................LOGIN............................


app.post('/login', async(req,res)=>{
  const {email, password} = req.body;
  const is_user = await UserModel.findOne({email});
  if(is_user){
    const userPassword = is_user.password;
    bcrypt.compare(password,userPassword,function(err,result){
      if(result){
        const token = jwt.sign({userID : is_user._id},process.env.SECRET_KEY, { expiresIn: '1h' })
        res.send({ msg :"login successfull", token : token} );
      }
      else{
        res.send("login fail, password miss matched")
    }
    })}
})


//......................USER details....................

app.get("/user", async(req, res) => {
   try{
       const data = await UserModel.find();
       res.send(data);
   }catch(err){
    console.log(err);
   }
});

//....................server run test...................

app.get("/", (req, res) => {
    res.send("home page");
});

//......................Find product with id......................

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await Product.findById(id);
    if (!data) {
      return res.status(404).send("Product not found");
    }
    res.send(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
});

//........................... All Products sorting searching filter........................

app.get("/products", async (req, res) => {
  const{category, _sort, _order, type} = req.query;
    try {
      const query = {};
      if(category){
 query.category = category;
      }
      if(type){
        query.type = type;
      }
      let sortObject = { price: _order === "desc" ? -1 : 1 }
      console.log("_sort:", _sort);
      console.log("_order:", _order);
      console.log("sortObject:", sortObject);
        const data = await Product.find(query).sort(sortObject);
        res.send(data);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//.................server listen part..............................

app.listen(PORT, async () => {
    try {
        await connection;
        console.log("DB Connected");
    } catch (err) {
        console.error("DB Not Connected", err);
    }
    console.log(`8080 is running`);
});
