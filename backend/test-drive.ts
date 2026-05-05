import dotenv from 'dotenv';
import { uploadToDrive } from './src/config/drive';
import path from 'path';

dotenv.config();

async function test() {
  try {
    const filePath = path.resolve('uploads/dummy.txt');
    const folderId = process.env.FOLDER_6_ANO || 'root';
    console.log(`Uploading to folder: ${folderId}`);
    
    const fileId = await uploadToDrive(filePath, 'dummy.txt', folderId);
    console.log(`Upload success! File ID: ${fileId}`);
  } catch (error) {
    console.error('Upload failed:');
    console.error(error);
  }
}

test();
