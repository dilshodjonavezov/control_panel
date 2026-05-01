import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;
let resolvedMongoUri: string | null = null;

async function createInMemoryMongoUri(): Promise<string> {
  if (resolvedMongoUri) {
    return resolvedMongoUri;
  }

  mongoMemoryServer ??= await MongoMemoryServer.create({
    binary: {
      version: process.env.MONGO_MEMORY_VERSION || '7.0.14',
    },
    instance: {
      dbName: 'control_panel',
    },
  });

  resolvedMongoUri = mongoMemoryServer.getUri();
  return resolvedMongoUri;
}

async function canConnect(uri: string): Promise<boolean> {
  let client: MongoClient | null = null;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client?.close().catch(() => undefined);
  }
}

export async function resolveMongoUri(preferredUri?: string | null): Promise<string> {
  const normalizedPreferredUri = preferredUri?.trim();
  const forceInMemory = process.env.MONGO_IN_MEMORY === 'true';

  if (!forceInMemory && normalizedPreferredUri) {
    const preferredAvailable = await canConnect(normalizedPreferredUri);
    if (preferredAvailable) {
      return normalizedPreferredUri;
    }

    // eslint-disable-next-line no-console
    console.warn(`MongoDB is unavailable at ${normalizedPreferredUri}. Falling back to in-memory MongoDB.`);
  }

  const memoryUri = await createInMemoryMongoUri();
  process.env.MONGO_URI = memoryUri;

  if (forceInMemory) {
    // eslint-disable-next-line no-console
    console.warn(`MONGO_IN_MEMORY=true. Using in-memory MongoDB: ${memoryUri}`);
  } else if (!normalizedPreferredUri) {
    // eslint-disable-next-line no-console
    console.warn(`MONGO_URI is not set. Using in-memory MongoDB: ${memoryUri}`);
  }

  return memoryUri;
}
