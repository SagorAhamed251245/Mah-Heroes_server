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
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection


      client.connect((err) => {
        if (err){
          console.error(err);
          return
        }
      });

    const productsCollection = client.db('mahHeroes').collection('products');
    const galleryCollection = client.db('mahHeroes').collection('galleryPhotos');

    const indexKeys = { toy_name: 1 };
    const indexOptions = { name: "toyName" };

    try {
      const result = await productsCollection.createIndex(indexKeys, indexOptions);
      console.log(result);
    } catch (error) {
      console.error("Error creating index:", error);
    }

   

    app.get('/products', async (req, res) => {
      
      const products = await productsCollection.find().toArray();
      res.send(products);
    })
    app.get('/galleryPhotos' , async (req , res)=> {
          const result = await galleryCollection.find().toArray()
          
          res.send(result)
    })

    app.get("/getToyByName/:text", async (req, res) => {
      const text = req.params.text;
      console.log(text);
      try {
        const result = await productsCollection
          .find({ toy_name: { $regex: text, $options: "i" } })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving data:", error);
        res.status(500).send("Error retrieving data");
      }
    });

    app.get('/products/limit', async (req, res) => {

      const products = await productsCollection.find().limit(20).toArray();
      res.send(products)

    })


    app.get('/products/:id', async (req, res) => {
      const id = req.params.id
      const product = await productsCollection.findOne({ _id: new ObjectId(id) });
      res.send(product);
    })

    app.get('/mytoys/:email/:sort', async (req, res) => {
      const myEmail = req.params.email;
      const sorting = req.params.sort;

      console.log(typeof myEmail, myEmail);
      console.log(typeof sorting, sorting);


      

      try {
        let result;
        result = await productsCollection
          .find({ seller_email: myEmail })
          .sort({ price: sorting === 'true' ? -1 : 1 }).collation({locale: "en_US" , numericOrdering: true})
          .toArray()


        result.forEach((toy) => {
          toy.price = parseInt(toy.price)
          console.log(toy.price);;
        })
          ;

        res.send(result);
      } catch (error) {
        console.error('Error retrieving toys:', error);
        res.status(500).json({ error: 'Error retrieving toys' });
      }


    })


    app.post('/addProduct', async (req, res) => {
      const body = req.body;
      const result = await productsCollection.insertOne(body)
      res.send(result)

    })
    app.patch('/updateToy/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const option = { upsert: true }
      const body = req.body
      const updateToyInfo = {
        $set: {
          price: body.price,
          available_quantity: body.available_quantity,
          description: body.description

        }
      }

      const result = await productsCollection.updateOne(filter, updateToyInfo, option)
      res.send(result)

    })
    app.delete('/deleteProduct/:id', async (req, res) => {
      const id = req.params.id;
      const result = await productsCollection.deleteOne({ _id: new ObjectId(id) })
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