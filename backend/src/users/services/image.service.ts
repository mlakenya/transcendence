import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageService {
  async saveImageLocally(imageUrl: string, saveFolderPath: string): Promise<string> {
    try {
      const response = await axios.get(imageUrl, { responseType: 'stream' });

      // Generate a random file name with a length of 32 characters
      const randomFileName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');

      // Get the image file extension from the URL (e.g., .jpg, .png, etc.)
      const fileExtension = path.extname(imageUrl);

      // Combine the folder path, random file name, and the extension to get the full local file path
      const localFilePath = path.join(saveFolderPath, randomFileName + fileExtension);

      // Create a writable stream to save the image
      const writer = fs.createWriteStream(localFilePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(path.basename(localFilePath)));
        writer.on('error', (error) => reject(error));
      });
    } catch (error) {
      throw new Error('Error while saving the image: ' + error.message);
    }
  }
}