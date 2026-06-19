import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const ADMIN_EMAIL = 'admin@smartrental.com';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Admin SmartRental';

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const users = db.collection('users');

  const existing = await users.findOne({ email: ADMIN_EMAIL });

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existing) {
    await users.updateOne(
      { email: ADMIN_EMAIL },
      {
        $set: {
          password: hashedPassword,
          role: 'admin',
          isActive: true,
          name: ADMIN_NAME,
        },
      }
    );
    console.log('Admin account updated successfully');
  } else {
    await users.insertOne({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      authProvider: 'local',
      refreshToken: null,
      savedProperties: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Admin account created successfully');
  }

  console.log(`\nAdmin credentials:`);
  console.log(`  Email   : ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
