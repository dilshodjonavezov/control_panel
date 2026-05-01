export const databaseConfig = () => ({
  database: {
    mongoUri: process.env.MONGO_URI || '',
  },
});
