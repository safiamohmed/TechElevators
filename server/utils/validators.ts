import { UploadedFile } from 'express-fileupload';

export class ReviewValidator {
  private static allowedFileTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'application/pdf', 
    'text/plain'
  ];
  private static maxFileSize = 5 * 1024 * 1024; // 5MB
  private static maxFiles = 5;

  // التحقق من صحة التقييم
  static validateRating(rating: number): { isValid: boolean; message?: string } {
    if (!rating || rating < 1 || rating > 5) {
      return { isValid: false, message: 'التقييم يجب أن يكون بين 1 و 5' };
    }
    return { isValid: true };
  }

  // التحقق من صحة التعليق
  static validateComment(comment: string, minLength: number = 10): { isValid: boolean; message?: string } {
    if (!comment || comment.trim().length < minLength) {
      return { isValid: false, message: `التعليق يجب أن يكون ${minLength} أحرف على الأقل` };
    }
    return { isValid: true };
  }

  // التحقق من صحة الملفات
  static validateFiles(files: UploadedFile | UploadedFile[] | undefined): { isValid: boolean; errors: string[] } {
    if (!files) return { isValid: true, errors: [] };
    
    const fileArray = Array.isArray(files) ? files : [files];
    const errors: string[] = [];

    // التحقق من عدد الملفات
    if (fileArray.length > this.maxFiles) {
      errors.push(`الحد الأقصى للملفات هو ${this.maxFiles}`);
    }

    fileArray.forEach((file, index) => {
      // التحقق من نوع الملف
      if (!this.allowedFileTypes.includes(file.mimetype)) {
        errors.push(`الملف ${index + 1}: نوع غير مسموح. المسموح: JPEG, PNG, PDF, TXT`);
      }

      // التحقق من حجم الملف
      if (file.size > this.maxFileSize) {
        errors.push(`الملف ${index + 1}: الحجم يتجاوز 5MB`);
      }

      // التحقق من اسم الملف
      if (file.name.length > 255) {
        errors.push(`الملف ${index + 1}: اسم الملف طويل جداً`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}