import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

if (!uri) {
  throw new Error('Please add your Mongo URI to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!(global as any)._mongoClientPromise) {
    client = new MongoClient(uri, options);
    (global as any)._mongoClientPromise = client.connect().catch(err => {
      console.error('Failed to connect to MongoDB:', err);
      throw err;
    });
  }
  clientPromise = (global as any)._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    throw err;
  });
}


export default clientPromise;