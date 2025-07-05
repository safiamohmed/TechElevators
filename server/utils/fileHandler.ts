import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { UploadedFile } from 'express-fileupload';

// تحويل fs.unlink إلى Promise-based
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);

export class FileHandler {
  private static uploadsDir = path.join(__dirname, '../uploads/reviews');
  private static tempDir = path.join(__dirname, '../temp');

  // إنشاء مجلدات الرفع إذا لم تكن موجودة
  static async ensureDirectoriesExist(): Promise<void> {
    try {
      await accessAsync(this.uploadsDir);
    } catch {
      await mkdirAsync(this.uploadsDir, { recursive: true });
    }

    try {
      await accessAsync(this.tempDir);
    } catch {
      await mkdirAsync(this.tempDir, { recursive: true });
    }
  }
// رفع ملف واحد
  static async uploadSingleFile(file: UploadedFile): Promise<string> {
    await this.ensureDirectoriesExist();

    // توليد اسم فريد للملف
    const fileExtension = path.extname(file.name);
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, filename);

    // رفع الملف
    await file.mv(filePath);
    
    return `/uploads/reviews/${filename}`;
  }

  // رفع ملفات متعددة
  static async uploadMultipleFiles(files: UploadedFile | UploadedFile[]): Promise<string[]> {
    const fileArray = Array.isArray(files) ? files : [files];
    const uploadedFiles: string[] = [];

    for (const file of fileArray) {
      const filePath = await this.uploadSingleFile(file);
      uploadedFiles.push(filePath);
    }

    return uploadedFiles;
  }

  // حذف ملف واحد
  static async deleteSingleFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      await unlinkAsync(fullPath);
      return true;
    } catch (error) {
      console.error(`فشل في حذف الملف: ${filePath}`, error);
      return false;
    }
  }

  // حذف ملفات متعددة
  static async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    const deletePromises = filePaths.map(filePath => this.deleteSingleFile(filePath));
    await Promise.allSettled(deletePromises);
  }

  // تنظيف الملفات المؤقتة
  static async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.tempDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.promises.stat(filePath);
        
        // حذف الملفات الأقدم من ساعة
        if (now - stats.mtime.getTime() > 60 * 60 * 1000) {
          await unlinkAsync(filePath);
          console.log(`تم تنظيف الملف المؤقت: ${file}`);
        }
      }
    } catch (error) {
      console.error('خطأ في تنظيف الملفات المؤقتة:', error);
    }
  }
}

// تشغيل تنظيف الملفات كل ساعة
setInterval(() => {
  FileHandler.cleanupTempFiles();
}, 60 * 60 * 1000);