const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware 

app.use(cors());
app.use(express.json());



app.get('/', (req, res) => {
  res.send('Hello World');
});


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ry6i5bk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection


    const productsCollection = client.db('mahHeroes').collection('products');

    app.get('/products', async (req, res) => {
      const products = await productsCollection.find().toArray();
      res.send(products);
    })
    app.get('/products/limit', async (req, res) => {

      const products = await productsCollection.find().limit(20).sort({ price: -1 }).toArray();
      res.send(products)

    })


    app.get('/products/:id', async (req, res) => {
      const id = req.params.id
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      res.send(product);
    })

    app.get('/mytoys/:email', async (req, res) => {
      const myEmail = req.params.email;
      const result = await productsCollection.find({ seller_email: myEmail }).toArray()
      res.send(result)
      
    })
    

    app.post('/addProduct', async (req, res) => {
      const body = req.body;
      const result = await productsCollection.insertOne(body)
      res.send(result)
      
    })
    app.patch('/updateToy/:id', async(req , res)=> {
      const id = req.params.id ;
      const filter = {_id: new ObjectId(id)}
      const option = { upsert: true}
      const body = req.body
      const updateToyInfo = {
        $set: {
          price: body.price ,
          available_quantity: body.available_quantity ,
          description: body.description 

        }
      }

      const result = await productsCollection.updateOne(filter , updateToyInfo , option)
      res.send(result)
      
    })
    app.delete('/deleteProduct/:id' , async(req , res)=> {
      const id = req.params.id ;
      const result = await productsCollection.deleteOne({_id: new ObjectId(id)})
      res.send(result)
    })






    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
})