const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.idds8so.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const dataset = client.db("CareCoordDB");
    const usersCollection = dataset.collection("users");
    const testimonialsCollection = dataset.collection("testimonials");
    const campsCollection = dataset.collection("camps");
    const requestsCollection = dataset.collection("requests");

    // use verify
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyParticipant = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isParticipant = user?.role === "Participant";
      if (!isParticipant) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyOrganizer = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isOrganizer = user?.role === "Organizer";
      if (!isOrganizer) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    const verifyHealthPro = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isHealthPro = user?.role === "Healthcare Professional";
      if (!isHealthPro) {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    //user related
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/organizer/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let organizer = false;
      if (user) {
        organizer = user?.role === "Organizer";
      }
      res.send({ organizer });
    });

    app.get("/users/participant/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let participant = false;
      if (user) {
        participant = user?.role === "Participant";
      }
      res.send({ participant });
    });

    app.get("/users/healthpro/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let healthpro = false;
      if (user) {
        healthpro = user?.role === "Healthcare Professional";
      }
      res.send({ healthpro });
    });

    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/usersByEmail/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email: email });
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // camps
    app.get("/camps", async (req, res) => {
      const result = await campsCollection.find().toArray();
      res.send(result);
    });

    app.get("/camps/:id", async (req, res) => {
      const id = req.params.id;
      const result = await campsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/campsByUser/:id", async (req, res) => {
      const id = req.params.id;
      const result = await campsCollection
        .find({ organizer: new ObjectId(id) })
        .toArray();
      res.send(result);
    });

    app.post("/camps", async (req, res) => {
      const organizer = req.body.organizer;
      const new_post = {
        ...req.body,
        timePosted: new Date(),
        organizer: new ObjectId(organizer),
      };
      const result = await campsCollection.insertOne(new_post);
      res.send(result);
    });

    // requests

    app.get("/requests/:id", async (req, res) => {
      const id = req.params.id;
      const result = await requestsCollection
        .find({ user_id: new ObjectId(id) })
        .toArray();
      res.send(result);
    });

    app.get("/requestsToUser/:id", async (req, res) => {
      const id = req.params.id;
      const camps = await campsCollection
        .find({ organizer: new ObjectId(id) }, { projection: { _id: 1 } })
        .map((user) => String(user._id))
        .toArray();
      // console.log(camps);
      const campObjectIds = camps.map((id) => new ObjectId(id));
      const result = await requestsCollection
        .find({ camp_id: { $in: campObjectIds } })
        .toArray();
      // console.log(result);
      res.send(result);
    });

    app.post("/requests", async (req, res) => {
      const user_id = req.body.user_id;
      const camp_id = req.body.camp_id;
      const status = req.body.status;
      const new_post = {
        user_id: new ObjectId(user_id),
        camp_id: new ObjectId(camp_id),
        status: status,
      };

      const existingReq = await requestsCollection.findOne({
        user_id: new ObjectId(user_id),
        camp_id: new ObjectId(camp_id),
      });
      if (existingReq) {
        res.send("already added");
      } else {
        const result = await requestsCollection.insertOne(new_post);
        res.send(result);
      }
    });

    app.patch("/updateReqStatus/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;

      const result = await requestsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: status } },
        { upsert: true }
      );
      res.send(result);
    });

    // Testimonials
    app.get("/testimonials", async (req, res) => {
      const result = await testimonialsCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } catch (error) {
    console.log(error);
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MCMS server is running");
});

app.listen(port, () => {
  console.log(`Server started at ${port}`);
});
