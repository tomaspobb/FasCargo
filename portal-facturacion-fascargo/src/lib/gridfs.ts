// 📁 src/lib/gridfs.ts
import mongoose from 'mongoose';
import grid from 'gridfs-stream';
import { connectToDatabase } from './mongodb';

let gfs: any;

connectToDatabase().then(() => {
  const db = mongoose.connection.db;
  const mongoDriver = mongoose.mongo;
  gfs = grid(db, mongoDriver);
  gfs.collection('fs'); // nombre default
});

export const Attachment = {
  write: (options: any, buffer: Buffer) => {
    return new Promise((resolve, reject) => {
      const writeStream = gfs.createWriteStream(options);
      writeStream.write(buffer);
      writeStream.end();
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
    });
  },
  read: (query: any) => {
    return gfs.createReadStream(query);
  },
  findOne: (query: any) => {
    return new Promise((resolve, reject) => {
      gfs.files.findOne(query, (err: any, file: any) => {
        if (err) reject(err);
        else resolve(file);
      });
    });
  },
};
