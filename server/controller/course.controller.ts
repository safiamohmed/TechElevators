import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiOptions } from 'cloudinary';
import { createCourse, getAllCoursesService } from "../services/course.service";
import CourseModel from "../models/course.model";
import userModel from "../models/user.model";
import OrderModel from "../models/order.model";
import mongoose from "mongoose";
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import axios from "axios";
import ejs from "ejs";
import { ICourse } from "../models/course.model";
import ffmpeg from 'fluent-ffmpeg';
import { FileHandler } from '../utils/fileHandler';
import { ReviewValidator } from '../utils/validators';
import { ReviewHelper } from '../utils/reviewHelper';
import { IReview, IReplyData, IPaginationQuery, ISegment, TranscriptionResult  } from '../models/course.model';
import FormData from "form-data";
import { HfInference } from '@huggingface/inference';
// Initialize Cloudinary Config
const ensureCloudinaryConfig = () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary configuration is missing");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const checkCloudinaryStorage = async (): Promise<{ available: boolean; availableSpace: number }> => {
  try {
    ensureCloudinaryConfig();
    const result = await cloudinary.api.usage();

    const usedBytes = result.storage?.usage;
    if (typeof usedBytes !== 'number') {
      throw new Error("Unexpected Cloudinary API response: storage.usage is missing");
    }
    const usedStorage = usedBytes / (1024 * 1024);

    const planLimitMB = process.env.CLOUDINARY_STORAGE_LIMIT
      ? parseInt(process.env.CLOUDINARY_STORAGE_LIMIT, 10)
      : 10 * 1024;

    const availableSpace = planLimitMB - usedStorage;

    return {
      available: availableSpace > 100,
      availableSpace,
    };
  } catch (error) {
    console.error("Failed to check Cloudinary storage:", error instanceof Error ? error.message : String(error));
    throw error;
  }
};

const uploadVideoWithRetry = async (filePath: string, maxRetries = 3): Promise<any> => {
  let attempts = 0;
  let lastError: any = null;
  
  while (attempts < maxRetries) {
    attempts++;
    try {
      ensureCloudinaryConfig();
      
      // Check file path exists
      if (!filePath) {
        throw new Error("File path is missing");
      }
      
      const options: UploadApiOptions = {
        resource_type: "video",
        folder: "courses/videos",
        chunk_size: 6000000,
        timeout: 300000,
        quality: "auto",
        format: "mp4"
      };
      
      const result = await cloudinary.uploader.upload(filePath, options);
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Enhanced error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error, Object.getOwnPropertyNames(error))
          : String(error);
      
      console.error(`Upload attempt ${attempts} failed:`, errorMessage);
      
      if (attempts >= maxRetries) {
        throw new Error(`Failed to upload video after ${maxRetries} attempts. Last error: ${errorMessage}`);
      }
      
      // Exponential backoff delay
      const delay = 1000 * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`All upload attempts failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
};

export const getVideoDurationFromCloudinary = async (publicId: string): Promise<number> => {
 try {
    console.log(`☁️ Getting video duration from Cloudinary for: ${publicId}`);
    ensureCloudinaryConfig();
    
    // Add retry mechanism for Cloudinary API calls
    let retries = 5; // Increased retries
    let lastError;
    
    while (retries > 0) {
      try {
        console.log(`☁️ Cloudinary API attempt ${6 - retries}/5 for: ${publicId}`);
        
        const result = await cloudinary.api.resource(publicId, {
          resource_type: 'video',
          image_metadata: true
        });
        
        console.log(`☁️ Cloudinary response for ${publicId}:`, {
          duration: result.duration,
          bytes: result.bytes,
          format: result.format,
          created_at: result.created_at,
          status: result.status
        });
        
        if (result.duration && result.duration > 0) {
          const roundedDuration = Math.round(result.duration);
          console.log(`✅ Cloudinary duration found: ${roundedDuration} seconds`);
          return roundedDuration;
        }
        
        // If no duration but video is still processing, wait and retry
        if (result.status === 'pending' || !result.duration) {
          console.log(`⏳ Video still processing on Cloudinary, waiting...`);
          if (retries > 1) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          }
        }
        
      } catch (apiError: any) {
        lastError = apiError;
        console.warn(`⚠️ Cloudinary API attempt failed (${6 - retries}/5):`, {
          message: apiError.message,
          code: apiError.error?.http_code,
          publicId
        });
        
        // If it's a not found error, don't retry
        if (apiError.error?.http_code === 404) {
          console.error(`❌ Video not found on Cloudinary: ${publicId}`);
          break;
        }
        
        // Wait before retry
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      retries--;
    }
    
    console.warn(`❌ Failed to get duration from Cloudinary after all retries for: ${publicId}`);
    if (lastError) {
      console.error(`Last error:`, lastError);
    }
    return 0;
    
  } catch (error) {
    console.error(`❌ Unexpected error getting video duration from Cloudinary:`, error);
    return 0;
  }
};

export const getVideoDuration = async (filePath: string): Promise<number> => {
  return new Promise((resolve) => {
    console.log(`🔍 Checking video duration for: ${filePath}`);
    
    // Check if file exists first
    if (!require('fs').existsSync(filePath)) {
      console.warn(`❌ Video file not found: ${filePath}`);
      return resolve(0);
    }

    // Check file size (if too small, might be corrupted)
    try {
      const stats = require('fs').statSync(filePath);
      console.log(`📁 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
      if (stats.size < 1000) { // Less than 1KB
        console.warn(`❌ File too small, might be corrupted: ${filePath}`);
        return resolve(0);
      }
    } catch (statsError) {
      console.error(`❌ Error reading file stats:`, statsError);
      return resolve(0);
    }

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn(`⏰ Video duration check timed out for: ${filePath}`);
      resolve(0);
    }, 15000); // 15 seconds timeout

    console.log(`🎬 Running ffprobe on: ${filePath}`);
    
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      clearTimeout(timeout);
      
      if (err) {
        console.error(`❌ ffprobe error for ${filePath}:`, {
          message: err.message,
          code: err.code,
          signal: err.signal
        });
        return resolve(0);
      }

      console.log(`📊 ffprobe metadata for ${filePath}:`, {
        format: metadata?.format ? {
          duration: metadata.format.duration,
          size: metadata.format.size,
          bit_rate: metadata.format.bit_rate,
          format_name: metadata.format.format_name
        } : 'No format data',
        streams: metadata?.streams ? metadata.streams.length : 0
      });

      const duration = metadata?.format?.duration;
      
      if (typeof duration === 'number' && duration > 0) {
        const roundedDuration = Math.round(duration);
        console.log(`✅ Video duration found: ${roundedDuration} seconds (${Math.floor(roundedDuration/60)}:${(roundedDuration%60).toString().padStart(2,'0')})`);
        resolve(roundedDuration);
      } else {
        console.warn(`❌ Invalid or missing duration for ${filePath}:`, {
          duration,
          type: typeof duration,
          metadata_format: metadata?.format
        });
        resolve(0);
      }
    });
  });
};

// Alternative method using a different approach
const getVideoDurationAlternative = async (videoUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    console.log(`🔄 Trying alternative duration method for URL: ${videoUrl}`);
    
    // This method tries to get duration from the video URL directly
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    const timeout = setTimeout(() => {
      console.warn(`⏰ Alternative duration method timed out`);
      resolve(0);
    }, 10000);
    
    video.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = Math.round(video.duration);
      console.log(`✅ Alternative method found duration: ${duration} seconds`);
      resolve(duration);
    };
    
    video.onerror = (error) => {
      clearTimeout(timeout);
      console.error(`❌ Alternative duration method failed:`, error);
      resolve(0);
    };
    
    video.src = videoUrl;
  });
};

// Main function to get video duration with multiple fallbacks
export const getVideoDurationWithFallbacks = async (
  tempFilePath: string, 
  cloudinaryPublicId?: string, 
  videoUrl?: string
): Promise<number> => {
  console.log(`🎯 Getting video duration with fallbacks...`);
  
  // Method 1: Try local file first (fastest)
  if (tempFilePath) {
    console.log(`1️⃣ Trying local file method...`);
    const localDuration = await getVideoDuration(tempFilePath);
    if (localDuration > 0) {
      console.log(`✅ Got duration from local file: ${localDuration}s`);
      return localDuration;
    }
  }
  
  // Method 2: Try Cloudinary API  
  if (cloudinaryPublicId) {
    console.log(`2️⃣ Trying Cloudinary API method...`);
    const cloudinaryDuration = await getVideoDurationFromCloudinary(cloudinaryPublicId);
    if (cloudinaryDuration > 0) {
      console.log(`✅ Got duration from Cloudinary: ${cloudinaryDuration}s`);
      return cloudinaryDuration;
    }
  }
  
  // Method 3: Try alternative method with video URL (browser-based)
  if (videoUrl && typeof document !== 'undefined') {
    console.log(`3️⃣ Trying alternative URL method...`);
    const urlDuration = await getVideoDurationAlternative(videoUrl);
    if (urlDuration > 0) {
      console.log(`✅ Got duration from URL: ${urlDuration}s`);
      return urlDuration;
    }
  }
  
  console.warn(`❌ All duration methods failed, returning 0`);
  return 0;
};


interface ICourseDataExtended {
  _id?: string;
  title: string;
  description: string;
  videoUrl: string;
  videoPublicId?: string;
  storageType?: string;
  videoThumbnail: {
    public_id?: string;
    url?: string;
  };
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: any[];
  suggestion: string;
  questions: any[];
}

const deleteFromCloudinary = async (publicId: string, resourceType: string = "image"): Promise<void> => {
  try {
    ensureCloudinaryConfig();

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    if (result.result === 'ok') {
      console.log(`Successfully deleted: ${publicId}`);
    } else {
      console.warn(`Delete may have failed: ${publicId}, result: ${result.result}`);
    }
  } catch (error) {
    console.error(`Error deleting from Cloudinary:`, error);
    throw error;
  }
};
// Helper function to get transcript from WhisperX with retry mechanism
// export const getTranscriptFromWhisper = async (filePath: string, maxRetries = 3): Promise<TranscriptionResult> => {
//   let attempts = 0;
//   while (attempts < maxRetries) {
//     try {
//       const form = new FormData();
//       form.append("file", fs.createReadStream(filePath), { filename: path.basename(filePath) }); // إرسال كـ MP4
//       const whisperxUrl = process.env.WHISPERX_URL || "http://25.21.255.92:8001/transcribe"; // الـ fallback لو `.env` فشل
//       const res = await axios.post(whisperxUrl, form, {
//         headers: form.getHeaders(),
//         timeout: 600000,
//       });
//       if (res.status === 200) {
//         const data = res.data;
//         console.log("Received segments:", data.segments); // للفحص
//         if (data.segments && Array.isArray(data.segments)) {
//           const segments = data.segments as ISegment[];
//           const language = data.language || 'unknown';

//           // تلخيص النص بناءً على اللغة
//           let summary: string = "Failed to summarize text";
//           const text = segments.map((s: ISegment) => s.text).join(' ');
//           const hfApiToken = process.env.HF_API_TOKEN;
//           if (!hfApiToken) throw new Error("Hugging Face API Token is not configured");
//           const hf = new HfInference(hfApiToken);
//           try {
//             let model = 'facebook/bart-large-cnn'; // Default للإنجليزية
//             if (language === 'ar' || language.includes('ar')) model = 'UBC-NLP/MARBART'; // لو عربي
//             console.log(`Text length: ${text.length}, attempting summarization with model: ${model}`);

//             // تقسيم النص إلى جمل بناءً على النقاط
//             const sentences = text.split('.').map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
//             const chunkSize = 3; // عدد الجمل في كل قطعة (يمكن تعديله)
//             const chunks = [];
//             for (let i = 0; i < sentences.length; i += chunkSize) {
//               chunks.push(sentences.slice(i, i + chunkSize).join('. ').trim() + '.');
//             }

//             const summaries = await Promise.all(chunks.map(async (chunk) => {
//               if (chunk.trim().length > 0) {
//                 const summarization = await hf.summarization({
//                   model: model,
//                   inputs: chunk,
//                   parameters: { max_length: 100, min_length: 30 },
//                 });
//                 return summarization.summary_text;
//               }
//               return "";
//             }));

//             summary = summaries.filter(s => s).join(" ");
//             if (summary) {
//               console.log(`✅ Summarized for file ${path.basename(filePath)}, Model: ${model}`);
//             } else {
//               console.warn(`No valid summary generated for ${path.basename(filePath)}`);
//             }
//           } catch (summarizationError) {
//             console.warn(`Failed to summarize for ${path.basename(filePath)}:`, summarizationError);
//           }
//           try {
//             fs.unlinkSync(filePath);
//             console.log(`✅ Temporary file deleted: ${filePath}`);
//           } catch (err) {
//             console.warn(`⚠️ Failed to delete ${filePath}: ${err}`);
//           }
//           return { segments, language, summary };
//         } else {
//           throw new Error("No segments found in response");
//         }
//       }
//       return { segments: [{ text: "Conversion to text failed", start: 0.0, end: 0.0 }], language: 'unknown', summary: undefined };
//     } catch (error) {
//       attempts++;
//       if (attempts >= maxRetries) throw error;
//       console.warn(`⚠️ Retry ${attempts} due to error:`, error);
//       await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
//     }
//   }
//   throw new Error("Failed to get transcript after retries");
// };

export const uploadCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    ensureCloudinaryConfig();
    const data: any = { ...req.body };
    data.isPaid = req.body.isPaid === "true";
    // تحويل benefits و prerequisites من JSON إذا كانت سترينج
    console.log("Raw benefits:", req.body.benefits);
    console.log("Raw prerequisites:", req.body.prerequisites);

    if (typeof data.benefits === "string") {
      try {
        data.benefits = JSON.parse(data.benefits);
      } catch (error) {
        
        data.benefits = [];
      }
    }
    if (typeof data.prerequisites === "string") {
      try {
        data.prerequisites = JSON.parse(data.prerequisites);
      } catch (error) {
      
        data.prerequisites = [];
      }
    }

    // تحقق من البيانات بعد التحويل
    console.log("Parsed benefits:", data.benefits);
    console.log("Parsed prerequisites:", data.prerequisites);

    // تحقق من وجود benefits و prerequisites
    if (!data.benefits || !Array.isArray(data.benefits)) {
      console.warn("Benefits is empty or not an array, setting to empty array");
      data.benefits = [];
    }
    if (!data.prerequisites || !Array.isArray(data.prerequisites)) {
      console.warn("Prerequisites is empty or not an array, setting to empty array");
      data.prerequisites = [];
    }

    console.log("Data to save:", {
      name: data.name,
      benefits: data.benefits,
      prerequisites: data.prerequisites,
    });

    // Ensure name is present using title if needed
    if (!data.name && data.title) {
      data.name = data.title;
    } else if (!data.name) {
      return res.status(400).json({ success: false, message: "Course name is required" });
    }

    const storageCheck = await checkCloudinaryStorage();
    if (!storageCheck.available) {
      return res.status(400).json({
        success: false,
        message: `Insufficient storage space. Available: ${storageCheck.availableSpace.toFixed(2)}MB`
      });
    }

    // Handle thumbnail upload
    if (req.files?.thumbnail) {
      const thumbnail = req.files.thumbnail as any;
      const uploadedThumb = await cloudinary.uploader.upload(thumbnail.tempFilePath, {
        folder: "courses/thumbnails",
        public_id: `${data.name.toLowerCase().replace(/\s+/g, "-")}_thumbnail_${Date.now()}`,
        overwrite: true,
      });
      data.thumbnail = {
        public_id: uploadedThumb.public_id,
        url: uploadedThumb.secure_url,
      };
    }

    // Handle video uploads
    let videos = req.files?.video as any;
    if (!videos) {
      return res.status(400).json({ success: false, message: "No video files found" });
    }
    if (!Array.isArray(videos)) videos = [videos];

    data.courseData = [];

    const getArrayFromFormData = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field.filter(Boolean);
      return [field].filter(Boolean);
    };

    const videoTitles = getArrayFromFormData(req.body.videoTitles);
    const videoDescriptions = getArrayFromFormData(req.body.videoDescriptions);
    const videoSections = getArrayFromFormData(req.body.videoSections);

    console.log("📋 Video upload info:", {
      videoCount: videos.length,
      videoTitles: videoTitles.length,
      videoDescriptions: videoDescriptions.length,
      videoSections: videoSections.length
    });

    const sectionVideoCount: { [key: string]: number } = {};

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const currentSection = videoSections[i] || "Default Section";
      sectionVideoCount[currentSection] = (sectionVideoCount[currentSection] || 0) + 1;
      const videoNumber = sectionVideoCount[currentSection];

      console.log(`🎬 Processing video ${i + 1}/${videos.length}: ${video.name}`);

      try {
        const uploadedVideo = await uploadVideoWithRetry(video.tempFilePath);
        console.log(`✅ Video uploaded successfully: ${uploadedVideo.public_id}`);

        let duration = 0;
        try {
          duration = await getVideoDurationWithFallbacks(
            video.tempFilePath,
            uploadedVideo.public_id,
            uploadedVideo.secure_url
          );
        } catch (durationError) {
          console.warn(`⚠️ Duration check failed for ${video.name}`, durationError);
          duration = 0;
        }

        const defaultTitle = videoTitles[i] || `${currentSection} - Video ${videoNumber}`;

        const videoData = {
          title: defaultTitle,
          description: videoDescriptions[i] || `Description for ${defaultTitle}`,
          videoUrl: uploadedVideo.secure_url,
          videoPublicId: uploadedVideo.public_id,
          storageType: "cloudinary",
          videoThumbnail: {
            public_id: uploadedVideo.public_id,
            url: uploadedVideo.secure_url
          },
          videoSection: currentSection,
          videoLength: duration,
          videoPlayer: "cloudinary",
          links: [],
          suggestion: "",
          questions: [],
          // transcript: segments,
          // language: language, // Add language from TranscriptionResult
          // summary: summary || "No summary available",
        };
         const videoPath = video.tempFilePath;
        // try {
        //   videoData.transcript = Segments;
        // } catch (error) {
        //    console.error(`❌ Failed to get transcript for ${video.name}:`, error);
        //    videoData.transcript = "Transcription failed"; // قيمة افتراضية
        // }

        // Clean up temporary files
        try {
          await fs.promises.unlink(videoPath);
          console.log(`✅ Temporary file deleted: ${videoPath}`);
        } catch (err) {
          console.warn(`⚠️ Failed to delete ${videoPath}: ${err}`);
        }


        data.courseData.push(videoData);
        console.log(`✅ Video data added:`, {
          title: videoData.title,
          section: videoData.videoSection,
          duration: `${duration}s`,
          url: uploadedVideo.secure_url.substring(0, 50) + '...'
        });

      } catch (videoError) {
        console.error(`❌ Error uploading video ${i + 1}:`, videoError);
        const cleanupPromises = data.courseData.map(async (courseVideo: any) => {
          try {
            await deleteFromCloudinary(courseVideo.videoPublicId, "video");
            console.log(`🗑️ Deleted: ${courseVideo.videoPublicId}`);
          } catch (cleanupError) {
            console.warn(`Failed to delete ${courseVideo.videoPublicId}:`, cleanupError);
          }
        });

        await Promise.allSettled(cleanupPromises);

        const errorMessage = videoError instanceof Error ? videoError.message : String(videoError);
        return res.status(500).json({
          success: false,
          message: `Failed to upload video ${i + 1}: ${video.name}`,
          error: errorMessage,
          uploadedVideoIndex: i
        });
      }
    }

    console.log(`📚 Sorting ${data.courseData.length} videos by section...`);
    data.courseData.sort((a: any, b: any) => {
      const sectionCompare = a.videoSection.localeCompare(b.videoSection);
      if (sectionCompare !== 0) return sectionCompare;
      const extractNumber = (title: string): number => {
        const match = title.match(/Video (\d+)/);
        return match ? parseInt(match[1]) : 0;
      };
      const aNum = extractNumber(a.title);
      const bNum = extractNumber(b.title);
      if (aNum && bNum) return aNum - bNum;
      return a.title.localeCompare(b.title);
    });

    const totalDuration = data.courseData.reduce((sum: number, v: any) => sum + (v.videoLength || 0), 0);
    const sections = [...new Set(data.courseData.map((v: any) => v.videoSection))];

    console.log(`📊 Final course stats:`, {
      courseName: data.name,
      totalVideos: data.courseData.length,
      sections,
      totalDurationMinutes: Math.round(totalDuration / 60),
      avgVideoLength: Math.round(totalDuration / data.courseData.length)
    });

    if (data.courseData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Course must have at least one video"
      });
    }

    console.log(`💾 Saving course to database...`);
    const savedCourse = await CourseModel.create(data);
    if (!savedCourse) {
      return res.status(500).json({
        success: false,
        message: "Failed to save course to database"
      });
    }

    if (redis) {
      try {
        await redis.set(savedCourse._id.toString(), JSON.stringify(savedCourse));
        console.log(`🔄 Cached in Redis: ${savedCourse._id}`);
      } catch (redisError) {
        console.warn("Redis cache error:", redisError);
      }
    }

    console.log(`🎉 Course created successfully: ${savedCourse.name} (ID: ${savedCourse._id})`);
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      course: savedCourse,
      stats: {
        totalVideos: data.courseData.length,
        totalDuration,
        sections: sections.length
      }
    });

  } catch (error: any) {
    console.error("❌ Error creating course:", error.message);
    console.error(error.stack);
    return res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message
    });
  }
};




// Course edit function - مع دعم الحذف والإضافة
// Course edit function - مع دعم الحذف والإضافة - Fixed Version
export const editCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body };
    const courseId = req.params.courseId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID" });
    }

    // 🧹 Clear ALL course-related cache BEFORE starting
    console.log("🧹 Clearing all course cache before update...");
    await clearAllCacheForCourse(courseId);

    ensureCloudinaryConfig();

    const courseData = await CourseModel.findById(courseId) as ICourse;
    if (!courseData) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // [Your existing upload and processing logic here...]
    // Handle thumbnail upload
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : req.files.thumbnail;

      if (courseData.thumbnail && courseData.thumbnail.public_id) {
        try {
          await deleteFromCloudinary(courseData.thumbnail.public_id, "image");
        } catch (deleteError) {
          console.warn("Could not delete old thumbnail:", deleteError);
        }
      }

      const myCloud = await cloudinary.uploader.upload(thumbnailFile.tempFilePath, {
        folder: "courses/thumbnails",
        public_id: `${(courseData.name || "course").toLowerCase().replace(/\s+/g, "-")}_thumbnail_${Date.now()}`,
      });

      data.thumbnail = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url
      };
    }

    data.courseData = [...(courseData.courseData || [])];

    // Handle video deletions
    const videosToDelete = req.body?.videosToDelete;
    if (videosToDelete) {
      const videoIdsToDelete = Array.isArray(videosToDelete) 
        ? videosToDelete.filter(Boolean)
        : [videosToDelete].filter(Boolean);

      const deletionPromises = videoIdsToDelete.map(async (videoId: string) => {
        const videoIndex = data.courseData.findIndex((video: any) =>
          video._id?.toString() === videoId.toString()
        );

        if (videoIndex !== -1) {
          const videoToDelete = data.courseData[videoIndex];

          if (videoToDelete.videoPublicId) {
            try {
              await deleteFromCloudinary(videoToDelete.videoPublicId, "video");
            } catch (deleteError) {
              console.warn(`Failed to delete from Cloudinary: ${videoToDelete.videoPublicId}`, deleteError);
              throw new Error(`Failed to delete video: ${videoToDelete.title}`);
            }
          }

          data.courseData.splice(videoIndex, 1);
          return { success: true, title: videoToDelete.title };
        } else {
          return { success: false, videoId, error: "Video not found" };
        }
      });

      const deletionResults = await Promise.allSettled(deletionPromises);
      const failedDeletions = deletionResults.filter(result => result.status === 'rejected');

      if (failedDeletions.length > 0) {
        return res.status(500).json({
          success: false,
          message: `Failed to delete ${failedDeletions.length} video(s)`,
          errors: failedDeletions
        });
      }
    }

    // Handle new video uploads
    let videos = req.files?.video;
    if (!videos) videos = [];
    if (!Array.isArray(videos)) videos = [videos];

    const getArrayFromFormData = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) return field.filter(Boolean);
      return [field].filter(Boolean);
    };

    const requestBody = req.body || {};
    const videoTitles = getArrayFromFormData(requestBody.videoTitles);
    const videoDescriptions = getArrayFromFormData(requestBody.videoDescriptions);
    const videoSections = getArrayFromFormData(requestBody.videoSections);

    // Upload new videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const currentSection = videoSections[i] || "Default Section";

      const existingInSection = data.courseData.filter((v: any) => 
        v.videoSection === currentSection
      ).length;
      const videoNumber = existingInSection + 1;

      try {
        const videoCloud = await uploadVideoWithRetry(video.tempFilePath, 3);

        let duration = 0;
        try {
          duration = await getVideoDurationWithFallbacks(
            video.tempFilePath,
            videoCloud.public_id,
            videoCloud.secure_url
          );
        } catch (durationError) {
          console.warn(`Could not get duration for ${video?.name || 'Unnamed video'}:`, durationError);
          duration = 0;
        }

        const videoTitle = `Video ${videoNumber}`;
        const videoDescription = videoDescriptions[i] || `Description for Video ${videoNumber}`;

        const videoData = {
          title: videoTitle,
          description: videoDescription,
          videoUrl: videoCloud.secure_url,
          videoPublicId: videoCloud.public_id,
          storageType: 'cloudinary',
          videoThumbnail: {
            public_id: videoCloud.public_id,
            url: videoCloud.secure_url
          },
          videoSection: currentSection,
          videoLength: duration,
          videoPlayer: "cloudinary",
          links: [],
          suggestion: "",
        };

        data.courseData.push(videoData);
        console.log(`✅ Added video ${videoTitle} to section ${currentSection}`);

      } catch (error: any) {
        console.error(`Error uploading video ${video?.name || 'Unnamed video'}:`, error);
        throw new Error(`Failed to upload ${video?.name || 'Unnamed video'}: ${error.message}`);
      }
    }

    // Sort and renumber videos
    data.courseData.sort((a: any, b: any) => {
      const sectionCompare = a.videoSection.localeCompare(b.videoSection);
      if (sectionCompare !== 0) return sectionCompare;

      const extractNumber = (title: string): number => {
        const match = title.match(/Video (\d+)/i);
        return match ? parseInt(match[1]) : 0;
      };

      const aNum = extractNumber(a.title);
      const bNum = extractNumber(b.title);

      if (aNum > 0 && bNum > 0) return aNum - bNum;
      return a.title.localeCompare(b.title);
    });

    const sectionCounts: { [key: string]: number } = {};
    data.courseData = data.courseData.map((video: any) => {
      const section = video.videoSection;
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;

      if (video.title.match(/^Video \d+$/)) {
        video.title = `Video ${sectionCounts[section]}`;
      }

      // Clean up data
      if (video.questions) {
        if (Array.isArray(video.questions)) {
          video.questions = video.questions.filter((q: any) => 
            q &&
  typeof q.user === "string" &&
  q.user.trim() !== ""
          );
          if (video.questions.length === 0) {
            delete video.questions;
          }
        } else {
          delete video.questions;
        }
      }

      if (video.links && Array.isArray(video.links)) {
        video.links = video.links.filter((link: any) => link && typeof link === 'object');
      }

      return video;
    });

    const cleanData = {
      ...data,
      courseData: data.courseData.map((video: any) => ({
        ...video,
        title: video.title || '',
        description: video.description || '',
        videoUrl: video.videoUrl || '',
        videoSection: video.videoSection || 'Default Section',
        videoLength: video.videoLength || 0,
        videoPlayer: video.videoPlayer || 'cloudinary',
        links: video.links || [],
        suggestion: video.suggestion || '',
        ...(video.videoPublicId && { videoPublicId: video.videoPublicId }),
        ...(video.videoThumbnail && { videoThumbnail: video.videoThumbnail }),
        ...(video.storageType && { storageType: video.storageType }),
      }))
    };

    // Update the course
    const updatedCourse = await CourseModel.findByIdAndUpdate(
      courseId,
      { $set: cleanData },
      { new: true, runValidators: true, context: 'query', upsert: false }
    );

    if (!updatedCourse) {
      return res.status(500).json({ success: false, message: "Failed to update course" });
    }

    // 🧹 Clear cache AGAIN after update
    console.log("🧹 Clearing cache after successful update...");
    await clearAllCacheForCourse(courseId);

    console.log("✅ Course updated successfully:", {
      id: updatedCourse._id,
      name: updatedCourse.name,
      videosCount: updatedCourse.courseData?.length || 0
    });

    // Final verification
    const finalCheck = await CourseModel.findById(courseId);
    console.log("🎯 Final verification - Videos in database:", finalCheck?.courseData?.length || 0);

    const sectionStats: { [key: string]: number } = {};
    (updatedCourse.courseData || []).forEach((video: any) => {
      const section = video.videoSection as string;
      sectionStats[section] = (sectionStats[section] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: updatedCourse,
      stats: {
        totalVideos: updatedCourse.courseData?.length || 0,
        sections: Object.keys(sectionStats).length,
        sectionBreakdown: sectionStats
      },
      debug: {
        cacheCleared: true,
        databaseUpdated: true,
        videosProcessed: videos.length,
        finalVideoCount: finalCheck?.courseData?.length || 0
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating course:", errorMessage);
    return res.status(500).json({ 
      success: false, 
      message: `Failed to update course with ID ${req.params.courseId || req.params.id}`,
      error: errorMessage 
    });
  }
};

// Helper function to clear all cache for a course
async function clearAllCacheForCourse(courseId: string) {
  if (!redis) return;
  
  try {
    // Individual course cache keys
    const courseKeys = [
      courseId,
      `course:${courseId}`,
      `course_${courseId}`,
      `courses:${courseId}`,
      `singleCourse:${courseId}`,
      `courseById:${courseId}`,
      `courseContent:${courseId}`
    ];
    
    // Clear individual keys
    for (const key of courseKeys) {
      await redis.del(key);
    }
    
    // Clear all course listing caches
    const listingKeys = await redis.keys("allCourses:*");
    for (const key of listingKeys) {
      await redis.del(key);
    }
    
    console.log(`🧹 Cleared all cache for course: ${courseId}`);
  } catch (error) {
    console.warn("Error clearing course cache:", error);
  }
}



// Function to delete entire course
export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const courseId = req.params.courseId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID" });
    }

    ensureCloudinaryConfig();

    // Find course
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    console.log(`Deleting course: ${course.name}`);

    // Delete thumbnail from Cloudinary
    if (course.thumbnail && course.thumbnail.public_id) {
      try {
        await deleteFromCloudinary(course.thumbnail.public_id, "image");
        console.log(`Deleted thumbnail: ${course.thumbnail.public_id}`);
      } catch (error) {
        console.warn("Could not delete thumbnail:", error);
      }
    }

    // Delete all videos from Cloudinary
    if (course.courseData && course.courseData.length > 0) {
      for (const video of course.courseData) {
        const videoData = video as ICourseDataExtended;
        if (videoData.videoPublicId) {
          try {
            await deleteFromCloudinary(videoData.videoPublicId, "video");
            console.log(`Deleted video: ${videoData.videoPublicId}`);
          } catch (error) {
            console.warn(`Could not delete video ${videoData.videoPublicId}:`, error);
          }
        }
      }
    }

    // Delete course from database
    await CourseModel.findByIdAndDelete(courseId);

    // Remove from Redis
    await redis.del(courseId);

    console.log("✅ Course deleted successfully");
    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error deleting course:", errorMessage);
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

// Function to delete single video from course
export const deleteVideoFromCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid Course ID" });
    }

    ensureCloudinaryConfig();

    // Find course
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Find video in course data
    const videoIndex = course.courseData.findIndex((video: ICourseDataExtended) => video._id?.toString() === videoId);
    if (videoIndex === -1) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    const videoToDelete = course.courseData[videoIndex] as ICourseDataExtended;

    // Delete video from Cloudinary
    if (videoToDelete.videoPublicId) {
      try {
        await deleteFromCloudinary(videoToDelete.videoPublicId, "video");
        console.log(`Deleted video from Cloudinary: ${videoToDelete.videoPublicId}`);
      } catch (error) {
        console.warn("Could not delete video from Cloudinary:", error);
      }
    }

    // Remove video from course data
    course.courseData.splice(videoIndex, 1);

    // Save updated course
    await course.save();

    // Update Redis
    await redis.set(courseId, JSON.stringify(course));

    console.log(`✅ Video deleted successfully: ${videoToDelete.title}`);
    res.status(200).json({
      success: true,
      message: "Video deleted successfully",
      course: course
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error deleting video:", errorMessage);
    return res.status(500).json({ success: false, message: errorMessage });
  }
};

// 🔧 Fixed getSingleCourse - NO CACHE for course details
export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      
      // Validate course ID
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid course ID", 400));
      }

      // 🚨 ALWAYS fetch fresh data from MongoDB - NO CACHE
      console.log("🔍 Fetching fresh course data from MongoDB (bypassing cache)");
      
      const course = await CourseModel.findById(courseId).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      console.log("✅ Fresh course data retrieved");
      console.log("🎥 Videos count:", course.courseData?.length || 0);
      
      // Optional: Update cache with fresh data but don't rely on it
      try {
        await redis.set(courseId, JSON.stringify(course), "EX", 3600); // Short cache - 1 hour
        console.log("💾 Updated cache with fresh data");
      } catch (cacheError) {
        console.warn("Cache update failed:", cacheError);
      }

      return res.status(200).json({
        success: true,
        course,
        debug: {
          videosCount: course.courseData?.length || 0,
          sections: [...new Set((course.courseData || []).map((v: any) => v.videoSection))].length,
          freshData: true
        }
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 🔧 Enhanced getAllCourses with better caching strategy + Student Count
export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, sort = "createdAt", order = "desc", price, search } = req.query;
     
      // Build dynamic query
      const query: any = {};
     
      if (category) {
        query.category = category;
      }
     
      if (price) {
        query.price = { $lte: Number(price) };
      }
     
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } }
        ];
      }
      
      // Create cache key based on query parameters
      const cacheKey = `allCourses:${JSON.stringify({ category, sort, order, price, search })}`;
     
      // Try cache first for course listings (not individual course details)
      try {
        const cachedCourses = await redis.get(cacheKey);
        if (cachedCourses) {
          console.log("✅ Course listing retrieved from cache");
          return res.status(200).json(JSON.parse(cachedCourses));
        }
      } catch (cacheError) {
        console.warn("Cache retrieval failed:", cacheError);
      }
      
      // Execute the query with sorting
      const courses = await CourseModel.find(query)
        .select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links")
        .sort({ [sort as string]: order === "desc" ? -1 : 1 });

      // Add student count to each course - FIXED VERSION
      const coursesWithStudentCount = [];
      
      for (const course of courses) {
        try {
          // Count students from Order model (includes both free and paid)
          const studentCount = await OrderModel.countDocuments({
            courseId: course._id
            // Add any additional conditions if needed:
            // status: "completed" // if you have a status field
          });
          
          console.log(`📊 Course: ${course.name}, Price: ${course.price}, Students: ${studentCount}`);
          
          // Add the course with student count
          coursesWithStudentCount.push({
            ...course.toObject(),
            studentsEnrolled: studentCount
          });
        } catch (err: any) {
          console.warn(`Error counting students for course ${course._id}:`, err);
          // Add course with 0 students if error occurs
          coursesWithStudentCount.push({
            ...course.toObject(),
            studentsEnrolled: 0
          });
        }
      }

      const response = {
        success: true,
        courses: coursesWithStudentCount,
        count: coursesWithStudentCount.length,
        debug: {
          totalCourses: coursesWithStudentCount.length,
          fromCache: false
        }
      };
      
      // Cache course listings for shorter time
      try {
        await redis.set(cacheKey, JSON.stringify(response), "EX", 1800); // 30 minutes
        console.log("💾 Cached course listing");
      } catch (cacheError) {
        console.warn("Cache storage failed:", cacheError);
      }
      
      return res.status(200).json(response);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);


// 🔧 New function to get course content for enrolled users
export const getCourseContent = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const userId = req.user?._id;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid course ID", 400));
      }

      // Check if user has access to this course
      const userCourseList = await userModel.findById(userId).select("courses");
      const courseExistInUser = userCourseList?.courses?.find((course: any) => 
        course._id.toString() === courseId
      );

      if (!courseExistInUser) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }

      // 🚨 ALWAYS get fresh course content from database
      console.log("🎥 Fetching fresh course content from MongoDB");
      
      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      console.log("✅ Fresh course content retrieved");
      console.log("🎥 Videos count:", course.courseData?.length || 0);

      return res.status(200).json({
        success: true,
        content: course.courseData,
        course: {
          _id: course._id,
          name: course.name,
          description: course.description
        },
        debug: {
          videosCount: course.courseData?.length || 0,
          sections: [...new Set((course.courseData || []).map((v: any) => v.videoSection))].length,
          freshData: true
        }
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 🛠️ Utility function to clear course cache
export const clearCourseCache = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid course ID", 400));
      }

      // Clear all possible cache keys for this course
      const cacheKeys = [
        courseId,
        `course:${courseId}`,
        `course_${courseId}`,
        `courses:${courseId}`,
        `singleCourse:${courseId}`,
        `courseById:${courseId}`,
        `courseContent:${courseId}`
      ];

      let clearedCount = 0;
      for (const key of cacheKeys) {
        try {
          const result = await redis.del(key);
          if (result > 0) clearedCount++;
        } catch (error) {
          console.warn(`Failed to clear cache key: ${key}`, error);
        }
      }

      // Also clear course listings cache
      const listingKeys = await redis.keys("allCourses:*");
      for (const key of listingKeys) {
        try {
          await redis.del(key);
          clearedCount++;
        } catch (error) {
          console.warn(`Failed to clear listing cache: ${key}`, error);
        }
      }

      console.log(`🧹 Cleared ${clearedCount} cache entries for course: ${courseId}`);

      return res.status(200).json({
        success: true,
        message: "Course cache cleared successfully",
        clearedEntries: clearedCount
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

/**
 * Get course content only for users who have purchased it
 */
export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try { 
      const courseId = req.params.id;
      
      // Validate the course ID
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler("Invalid course ID", 400));
      }

      // Retrieve the course first to check if it's free
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Check if course is paid or free
      const isPaid = course.price && course.price > 0;

      // Admin can access all courses
      if (req.user?.role !== "admin") {
        // إعادة تحميل بيانات المستخدم من قاعدة البيانات
        const freshUser = await userModel.findById(req.user?._id).select('courses');
        if (!freshUser) {
          return next(new ErrorHandler("User not found", 404));
        }

        const userCourseList = freshUser.courses || [];
        const courseExists = userCourseList.some(
          (userCourse: any) => userCourse._id.toString() === courseId
        );

        console.log("=== Course Access Debug Info ===");
        console.log("User ID:", req.user?._id);
        console.log("Course ID:", courseId);
        console.log("User courses:", userCourseList.map((c: any) => c._id.toString()));
        console.log("Course exists in user list:", courseExists);
        console.log("Is paid course:", isPaid);
        console.log("Course price:", course.price);

        if (isPaid) {
          // For paid courses, check if user has purchased it
          if (!courseExists) {
            console.log("Course not found in user list, checking orders...");
            
            // التحقق من الطلبات المكتملة كخطة احتياطية
            const userOrder = await OrderModel.findOne({
              userId: req.user?._id,
              courseId: courseId,
              'payment_info.status': { $in: ['succeeded', 'completed'] }
            });

            console.log("Found order:", !!userOrder);
            
            if (userOrder) {
              console.log("Found completed order, adding course to user...");
              
              try {
                // تأكد إن الكورس مش موجود قبل الإضافة (تجنب الـ Duplicate)
                if (!freshUser.courses.some((c: any) => c._id.toString() === course._id.toString())) {
                  freshUser.courses.push(course._id);
                  await freshUser.save();
                  console.log("Course added to user successfully");
                  
                  // محو الـ user cache وتحديثه
                  await redis.del(req.user?._id);
                  const updatedUser = await userModel.findById(req.user?._id);
                  await redis.set(req.user?._id, JSON.stringify(updatedUser));
                  
                  console.log("User cache updated");
                  
                  // إرسال إشعار للمستخدم
                  await NotificationModel.create({
                    user: freshUser._id,
                    title: "Course Access Restored",
                    message: `Your access to "${course.name}" has been restored based on your purchase history.`,
                  });
                  
                } else {
                  console.log("Course already exists in user list (race condition avoided)");
                }
                
              } catch (saveError: any) {
                console.error("Error saving user course:", saveError);
                // نكمل العملية لأن الكورس موجود في الـ order
                console.log("Continuing despite save error since order exists");
              }
              
            } else {
              console.log("No valid order found for this course");
              return next(
                new ErrorHandler("You must purchase this course to access its content", 403)
              );
            }
          } else {
            console.log("Course already exists in user courses list");
          }
          
        } else {
          // For free courses, auto-enroll user if not already enrolled
          if (!courseExists) {
            console.log("Auto-enrolling user in free course...");
            
            try {
              // تأكد إن الكورس مش موجود قبل الإضافة
              if (!freshUser.courses.some((c: any) => c._id.toString() === course._id.toString())) {
                freshUser.courses.push(course._id);
                await freshUser.save();
                
                // محو وتحديث الكاش
                await redis.del(req.user?._id);
                const updatedUser = await userModel.findById(req.user?._id);
                await redis.set(req.user?._id, JSON.stringify(updatedUser));
                
                // Send notification for free course enrollment
                await NotificationModel.create({
                  user: freshUser._id,
                  title: "Free Course Enrolled",
                  message: `You have been automatically enrolled in the free course: ${course.name}`,
                });

                console.log("User auto-enrolled in free course successfully");
                
                // إنشاء order للكورس المجاني للتتبع
                try {
                  const freeOrder = new OrderModel({
                    courseId: course._id,
                    userId: freshUser._id,
                    payment_info: {
                      id: "free_auto_enroll_" + Date.now(),
                      status: "completed",
                      type: "free"
                    },
                    courseData: []
                  });
                  
                  await freeOrder.save();
                  console.log("Free course order created for tracking");
                } catch (orderError: any) {
                  console.error("Failed to create free course order:", orderError.message);
                  // نكمل بدون رمي خطأ
                }
                
              } else {
                console.log("Free course already exists in user list (race condition avoided)");
              }
              
            } catch (enrollError: any) {
              console.error("Error auto-enrolling in free course:", enrollError);
              return next(new ErrorHandler("Failed to enroll in free course", 500));
            }
            
          } else {
            console.log("User already enrolled in free course");
          }
        }
      }

      // Retrieve the course content from the cache first
      const cacheKey = `courseContent:${courseId}`;
      let cachedContent;
      
      try {
        cachedContent = await redis.get(cacheKey);
      } catch (cacheError: any) {
        console.error("Redis cache error:", cacheError.message);
        // نكمل بدون cache
      }
      
      if (cachedContent) {
        console.log("Course content retrieved from Redis cache");
        try {
          const parsedContent = JSON.parse(cachedContent);
          return res.status(200).json(parsedContent);
        } catch (parseError: any) {
          console.error("Error parsing cached content:", parseError.message);
          // نحذف الكاش التالف ونكمل من قاعدة البيانات
          await redis.del(cacheKey);
        }
      }

      // *** FIX: Get course content with populated questions ***
      console.log("Retrieving course content from database with questions...");
      
      // Re-fetch course with populated questions
      const courseWithQuestions = await CourseModel.findById(courseId)
        .populate({
          path: 'courseData.questions',
          populate: [
            { path: 'user', select: 'name avatar' },
            { 
              path: 'questionReplies',
              populate: { path: 'user', select: 'name avatar' }
            }
          ]
        });
      
      if (!courseWithQuestions) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      const content = courseWithQuestions.courseData;
      
      // Log for debugging
      console.log("Content with questions:", content[0]?.questions?.length || 0, "questions found");
     
      // Store the course content in Redis for 24 hours
      const responseData = { 
        success: true, 
        content,
        courseInfo: {
          id: course._id,
          name: course.name,
          description: course.description,
          price: course.price,
          isPaid: isPaid,
          thumbnail: course.thumbnail,
          tags: course.tags,
          level: course.level,
          demoUrl: course.demoUrl,
          benefits: course.benefits,
          prerequisites: course.prerequisites,
          reviews: course.reviews,
          ratings: course.ratings,
          purchased: course.purchased
        }
      };
      
      // حفظ في الكاش مع معالجة الأخطاء
      try {
        await redis.set(cacheKey, JSON.stringify(responseData), "EX", 86400); // 24 hours
        console.log("Course content cached successfully");
      } catch (cacheError: any) {
        console.error("Failed to cache course content:", cacheError.message);
        // نكمل بدون cache
      }
     
      console.log("Course content retrieved successfully from database");
      console.log("=== End Debug Info ===");
      
      return res.status(200).json(responseData);
      
    } catch (error: any) {
      console.error("Error in getCourseByUser:", error);
      
      // معالجة أنواع مختلفة من الأخطاء
      if (error.name === 'CastError') {
        return next(new ErrorHandler("Invalid course ID format", 400));
      }
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return next(new ErrorHandler(`Validation Error: ${validationErrors.join(', ')}`, 400));
      }
      
      if (error.code === 11000) {
        return next(new ErrorHandler("Duplicate entry detected", 400));
      }
      
      return next(new ErrorHandler(error.message || "Internal server error", 500));
    }
  }
);
// Extended interface for course with instructor field
interface ICourseExtended {
  _id: string;
  name: string;
  instructor?: string;
  courseData: any[];
  save(): Promise<any>;
}

// Interface for user data in questions/answers
interface IUserData {
  _id: any;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  } | null;
}

// Interface for question object
interface IQuestionData {
  _id?: any;
  user: IUserData;
  question: string;
  questionReplies: IAnswerData[];
  attachment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for answer object
interface IAnswerData {
  _id?: any;
  user: IUserData;
  answer: string;
  attachment?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

interface IAddAnswerData extends IAddQuestionData {
  answer: string;
  questionId: string;
}

// Helper function to upload files to Cloudinary
const uploadToCloudinary = async (file: any, folder: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder,
      resource_type: "auto",
      quality: "auto:good", // Optimize quality
      fetch_format: "auto" // Auto format selection
    });
    
    // Clean up temp file after upload
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
    
    return result.secure_url;
  } catch (error) {
    // Clean up temp file even if upload fails
    if (fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
    throw error;
  }
};

// Helper function to validate file
const validateFile = (file: any): void => {
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Allowed: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX");
  }
  
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum 10MB allowed");
  }
};

 

// question management code

// Fixed version of the question management code

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;
      
      const course = await CourseModel.findById(courseId).populate('courseData.questions.user');
      
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) => {
        return item._id.equals(contentId);
      });

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      
      const newQuestion: any = {
        _id: new mongoose.Types.ObjectId(),
        user: req.user,
        question,
        questionReplies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      courseContent.questions.push(newQuestion);
      await course?.save();
      await course.populate('courseData.questions.user');
      
      // *** FIX: امسح الكاش بعد إضافة السؤال ***
      const cacheKey = `courseContent:${courseId}`;
      try {
        await redis.del(cacheKey);
        console.log("Cache cleared after adding question");
      } catch (cacheError: any) {
        console.error("Failed to clear cache:", cacheError.message);
      }
      
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Received",
        message: `You have a new question in ${courseContent.title}`,
      });

      res.status(200).json({
        success: true,
        message: "Question added successfully",
        course,
        newQuestion,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 2. في addAnswer function - امسح الكاش بعد إضافة الرد
export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswerData = req.body;
      
      const course = await CourseModel.findById(courseId).populate('courseData.questions.user');
      
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      
      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      
      const question = courseContent?.questions?.find((item: any) =>
        item._id.equals(questionId)
      );
      
      if (!question) {
        return next(new ErrorHandler("Invalid Question Id", 400));
      }
      
      const newAnswer: any = {
        _id: new mongoose.Types.ObjectId(),
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      question.questionReplies.push(newAnswer);
      await course?.save();
      await course.populate('courseData.questions.questionReplies.user');
      
      // *** FIX: امسح الكاش بعد إضافة الرد ***
      const cacheKey = `courseContent:${courseId}`;
      try {
        await redis.del(cacheKey);
        console.log("Cache cleared after adding answer");
      } catch (cacheError: any) {
        console.error("Failed to clear cache:", cacheError.message);
      }
      
      // Handle notifications and email...
      if (req.user?._id === question.user?._id) {
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        
        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }
      
      res.status(200).json({
        success: true,
        message: "Answer added successfully",
        course,
        newAnswer,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// 3. في deleteQuestion function - امسح الكاش بعد حذف السؤال
export const deleteQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, contentId, questionId } = req.params;
      const user = req.user;

      if (!user) {
        return next(new ErrorHandler("Unauthorized", 401));
      }

      const ids = [courseId, contentId, questionId];
      if (!ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
        return next(new ErrorHandler("Invalid ID format", 400));
      }

      const course = await CourseModel.findById(courseId).populate('courseData.questions.user') as any;
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const courseContent = course.courseData?.find((item: any) => 
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Course content not found", 404));
      }

      const questionIndex = courseContent.questions?.findIndex((item: any) => 
        item._id.equals(questionId)
      );
      if (questionIndex === -1) {
        return next(new ErrorHandler("Question not found", 404));
      }

      const question = courseContent.questions[questionIndex];

      const isOwner = user._id.toString() === question.user._id.toString();
      const isAdmin = user.role === 'admin';
      const isInstructor = course.instructor?.toString() === user._id.toString();

      if (!isOwner && !isAdmin && !isInstructor) {
        return next(new ErrorHandler("Access denied", 403));
      }

      courseContent.questions.splice(questionIndex, 1);
      await course.save();
      
      // *** FIX: امسح الكاش بعد حذف السؤال ***
      const cacheKey = `courseContent:${courseId}`;
      try {
        await redis.del(cacheKey);
        console.log("Cache cleared after deleting question");
      } catch (cacheError: any) {
        console.error("Failed to clear cache:", cacheError.message);
      }

      res.status(200).json({
        success: true,
        message: "Question deleted successfully",
        deletedQuestionId: questionId
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// add review and ratings in course
export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      
      // Check if user is enrolled in the course
      const courseExists = userCourseList?.some(
        (course: any) => course._id.toString() === courseId.toString()
      );
      
      if (!courseExists) {
        return next(new ErrorHandler("You are not enrolled in this course", 403));
      }
      
      // Get the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      const { review, rating } = req.body as { review: string; rating: number };
      
      // Validate rating
      const ratingValidation = ReviewValidator.validateRating(Number(rating));
      if (!ratingValidation.isValid) {
        return next(new ErrorHandler(ratingValidation.message!, 400));
      }
      
      // Validate review comment
      const reviewValidation = ReviewValidator.validateComment(review);
      if (!reviewValidation.isValid) {
        return next(new ErrorHandler(reviewValidation.message!, 400));
      }
      
      // Check if user already reviewed this course
      const existingReview = course.reviews.find(
        (rev: any) => rev.user._id.toString() === req.user?._id.toString()
      );
      
      if (existingReview) {
        return next(new ErrorHandler("You have already reviewed this course", 400));
      }
      
      // Handle file uploads
      let attachments: string[] = [];
      if (req.files?.attachments) {
        const fileValidation = ReviewValidator.validateFiles(
          req.files.attachments as UploadedFile | UploadedFile[]
        );
       
        if (!fileValidation.isValid) {
          return next(new ErrorHandler(fileValidation.errors.join(', '), 400));
        }
        
        try {
          attachments = await FileHandler.uploadMultipleFiles(
            req.files.attachments as UploadedFile | UploadedFile[]
          );
        } catch (fileError: any) {
          return next(new ErrorHandler(`File upload error: ${fileError.message}`, 400));
        }
      }
      
      // Create review data
      const reviewData = {
        user: req.user?._id,
        rating: Number(rating),
        review: review.trim(),
        attachments,
      };
      
      // Add review to course
      course.reviews.push(reviewData as any);
      
      // Calculate new average rating
      course.ratings = ReviewHelper.calculateAverageRating(course.reviews);
      
      await course.save();
      
      // Update cache
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      
      // Create notification
      await NotificationModel.create({
        user: req.user?._id,
        title: "New Review Added",
        message: `${req.user?.name} added a review for ${course?.name}`,
      });
      
      res.status(200).json({
        success: true,
        message: "Review added successfully",
        data: {
          course: {
            _id: course._id,
            name: course.name,
            ratings: course.ratings,
            reviewsCount: course.reviews.length,
          },
          review: {
            ...reviewData,
            user: req.user,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//add reply to review only for admin
export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IReplyData;
      
      // Validate comment
      const commentValidation = ReviewValidator.validateComment(comment, 5);
      if (!commentValidation.isValid) {
        return next(new ErrorHandler(commentValidation.message!, 400));
      }
      
      // Get the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      // Find the review
      const review = course.reviews.find(
        (rev: any) => rev._id.toString() === reviewId
      );
      
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      
      // Handle file uploads for reply
      let attachments: string[] = [];
      if (req.files?.attachments) {
        const fileValidation = ReviewValidator.validateFiles(
          req.files.attachments as UploadedFile | UploadedFile[]
        );
       
        if (!fileValidation.isValid) {
          return next(new ErrorHandler(fileValidation.errors.join(', '), 400));
        }
        
        try {
          attachments = await FileHandler.uploadMultipleFiles(
            req.files.attachments as UploadedFile | UploadedFile[]
          );
        } catch (fileError: any) {
          return next(new ErrorHandler(`File upload error: ${fileError.message}`, 400));
        }
      }
      
      // Create reply data
      const replyData = {
        user: req.user?._id,
        comment: comment.trim(),
        attachments,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Ensure replies array exists
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      
      // Add the reply
      review.commentReplies.push(replyData as any);
      
      // Save changes
      await course.save();
      
      // Update cache
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      
      // Notify review owner (avoid self-notification)
      if (review.user._id.toString() !== req.user?._id.toString()) {
        await NotificationModel.create({
          user: review.user._id,
          title: "Reply to Your Review",
          message: `${req.user?.name} replied to your review in ${course.name}`,
        });
      }
      
      res.status(200).json({
        success: true,
        message: "Reply added successfully",
        data: {
          reply: {
            ...replyData,
            user: req.user,
          },
          reviewId: reviewId,
          courseId: courseId,
        },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// مراجعة الكورس مع التقييم 
export const getCourseReviews = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const { page, limit, sortBy, sortOrder } = req.query as IPaginationQuery;

      const course = await CourseModel.findById(courseId).select('reviews ratings name');
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Sort the reviews
      const sortedReviews = ReviewHelper.sortReviews(
        course.reviews,
        sortBy || 'createdAt',
        sortOrder || 'desc'
      );

      // Paginate the reviews
      const paginatedResult = ReviewHelper.paginateReviews(
        sortedReviews,
        parseInt(page || '1'),
        parseInt(limit || '10')
      );

      // Calculate rating distribution
      const ratingDistribution = ReviewHelper.calculateRatingDistribution(course.reviews);

      res.status(200).json({
        success: true,
        data: {
          ...paginatedResult,
          courseInfo: {
            name: course.name,
            averageRating: course.ratings,
            totalReviews: course.reviews.length,
          },
          ratingDistribution,
        },
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
//updateReview
export const deleteReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, reviewId } = req.params;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const reviewIndex = course.reviews.findIndex(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (reviewIndex === -1) {
        return next(new ErrorHandler("Review not found", 404));
      }

      const review = course.reviews[reviewIndex];

      // Check permissions
      const isReviewOwner = review.user._id.toString() === req.user?._id.toString();
      const isAdmin = req.user?.role === 'admin';

      if (!isReviewOwner && !isAdmin) {
        return next(new ErrorHandler("You are not allowed to delete this review", 403));
      }

      // Delete attached files if any
      if (review.attachments && review.attachments.length > 0) {
        await FileHandler.deleteMultipleFiles(review.attachments);
      }

      // Remove the review
      course.reviews.splice(reviewIndex, 1);

      // Recalculate average rating
      course.ratings = ReviewHelper.calculateAverageRating(course.reviews);
      await course.save();

      // Update cache
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// updateReview
export const updateReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, reviewId } = req.params;
      const { review: newComment, rating: newRating } = req.body;

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const reviewIndex = course.reviews.findIndex(
        (rev: any) => rev._id.toString() === reviewId
      );

      if (reviewIndex === -1) {
        return next(new ErrorHandler("Review not found", 404));
      }

      let review = course.reviews[reviewIndex];

      // Only review owner can update
      if (review.user._id.toString() !== req.user?._id.toString()) {
        return next(new ErrorHandler("You are not allowed to update this review", 403));
      }

      // Validate new rating
      if (newRating) {
        const ratingValidation = ReviewValidator.validateRating(Number(newRating));
        if (!ratingValidation.isValid) {
          return next(new ErrorHandler(ratingValidation.message!, 400));
        }
        review.rating = Number(newRating);
      }

      // Validate new comment
      if (newComment) {
        const commentValidation = ReviewValidator.validateComment(newComment);
        if (!commentValidation.isValid) {
          return next(new ErrorHandler(commentValidation.message!, 400));
        }
        review.review = newComment.trim();
      }

      review.updatedAt = new Date();

      // Recalculate average rating
      course.ratings = ReviewHelper.calculateAverageRating(course.reviews);
      await course.save();

      // Update cache
      await redis.set(courseId, JSON.stringify(course), "EX", 604800);

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: {
          review: course.reviews[reviewIndex],
        },
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// get all course related info for admin
export const getAdminAllCourses = CatchAsyncError(
  async (req: Response, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
// delete course for admin


//generate video url
// Enhanced video URL generation
export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;

      // Validate videoId presence
      if (!videoId) {
        return next(new ErrorHandler("Video ID is required", 400));
      }

      // Validate API secret availability
      if (!process.env.VDOCIPHER_API_SECRET) {
        return next(new ErrorHandler("API secret not configured", 500));
      }

      // Configure request
      const requestConfig = {
        url: `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        method: 'POST',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
        },
        data: { 
          ttl: 300 // URL expires after 5 minutes
        },
        timeout: 10000 // 10 seconds timeout
      };

      const response = await axios(requestConfig);

      // Validate successful response
      if (response.status === 200 && response.data) {
        res.status(200).json({
          success: true,
          message: "Video URL generated successfully",
          data: response.data,
          expiresIn: 300 // in seconds
        });
      } else {
        return next(new ErrorHandler("Failed to generate video URL", 400));
      }

    } catch (error: any) {
      // Log error for monitoring
      console.error("Video URL generation error:", {
        error: error.message,
        videoId: req.body?.videoId,
        timestamp: new Date().toISOString()
      });

      // Handle different types of errors
      if (error.response) {
        // VdoCipher server error
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.message;
        
        switch (statusCode) {
          case 401:
            return next(new ErrorHandler("Invalid API key", 401));
          case 404:
            return next(new ErrorHandler("Video not found", 404));
          case 429:
            return next(new ErrorHandler("Rate limit exceeded, try again later", 429));
          default:
            return next(new ErrorHandler(`Server error: ${errorMessage}`, statusCode));
        }
      } else if (error.request) {
        // Network error
        return next(new ErrorHandler("Network connection error", 503));
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        return next(new ErrorHandler("Request timeout", 408));
      } else {
        // General error
        return next(new ErrorHandler(error.message || "Unexpected error occurred", 500));
      }
    }
  }
);

// Validation middleware for video request
export const validateVideoRequest = (req: Request, res: Response, next: NextFunction) => {
  const { videoId } = req.body;
  
  if (!videoId) {
    return next(new ErrorHandler("Video ID is required", 400));
  }
  
  if (typeof videoId !== 'string' || videoId.trim().length === 0) {
    return next(new ErrorHandler("Invalid video ID format", 400));
  }
  
  next();
};

// Helper function for retry mechanism
export const retryVideoUrlGeneration = async (
  videoId: string, 
  maxRetries: number = 3,
  delay: number = 1000
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
          timeout: 10000
        }
      );
      
      return response.data;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// function to get transcript and course name from course
// Enhanced get transcript handler
// Enhanced get transcript handler
export const getTranscript = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { videoName } = req.body;

      // Validate course ID format
      if (!id) {
        return next(new ErrorHandler("Course ID is required", 400));
      }

      // Validate MongoDB ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid course ID format", 400));
      }

      // Optional: Validate videoName if provided
      if (videoName && (typeof videoName !== 'string' || videoName.trim().length === 0)) {
        return next(new ErrorHandler("Invalid video name format", 400));
      }

      // Find course with error handling
      const course = await CourseModel.findById(id).select('name description courseData');
      
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Extract course information
      const courseName = course.name;
      const courseDescription = course.description;

      // Log for monitoring (optional)
      console.log("Transcript request:", {
        courseId: id,
        courseName,
        videoName: videoName || 'Not specified',
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent')
      });

      // Enhanced response with more information
      res.status(200).json({
        success: true,
        message: "Course information retrieved successfully",
        data: {
          courseId: id,
          courseName,
          courseDescription,
          videoName: videoName || null,
          requestedAt: new Date().toISOString()
        }
      });

    } catch (error: any) {
      // Enhanced error logging
      console.error("Get transcript error:", {
        error: error.message,
        stack: error.stack,
        courseId: req.params?.id,
        videoName: req.body?.videoName,
        timestamp: new Date().toISOString()
      });

      // Handle different types of errors
      if (error.name === 'CastError') {
        return next(new ErrorHandler("Invalid course ID format", 400));
      } else if (error.name === 'ValidationError') {
        return next(new ErrorHandler("Validation error: " + error.message, 400));
      } else if (error.code === 11000) {
        return next(new ErrorHandler("Duplicate entry error", 409));
      } else {
        return next(new ErrorHandler(error.message || "Internal server error", 500));
      }
    }
  }
);

// Validation middleware for transcript request
export const validateTranscriptRequest = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { videoName } = req.body;

  // Validate course ID
  if (!id) {
    return next(new ErrorHandler("Course ID is required", 400));
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Invalid course ID format", 400));
  }

  // Optional videoName validation
  if (videoName !== undefined) {
    if (typeof videoName !== 'string') {
      return next(new ErrorHandler("Video name must be a string", 400));
    }
    if (videoName.trim().length === 0) {
      return next(new ErrorHandler("Video name cannot be empty", 400));
    }
    if (videoName.length > 255) {
      return next(new ErrorHandler("Video name is too long (max 255 characters)", 400));
    }
  }

  next();
};

// Helper function to get course with transcript data
export const getCourseWithTranscript = async (courseId: string, videoName?: string) => {
  try {
    const course = await CourseModel.findById(courseId)
      .select('name description courseData')
      .lean(); // Use lean() for better performance when you don't need mongoose document methods

    if (!course) {
      throw new Error('Course not found');
    }

    // If videoName is provided, try to find specific video data
    let videoData = null;
    if (videoName && course.courseData && Array.isArray(course.courseData)) {
      // Search through course sections for video data
      for (const section of course.courseData) {
        if (section.videoSection && Array.isArray(section.videoSection)) {
          const foundVideo = section.videoSection.find((video: any) => 
            video.title === videoName || 
            video.videoUrl?.includes(videoName) ||
            video.videoId === videoName
          );
          if (foundVideo) {
            videoData = foundVideo;
            break;
          }
        }
      }
    }

    return {
      course,
      videoData,
      hasVideo: !!videoData
    };
  } catch (error) {
    throw error;
  }
};

// Alternative version with more specific transcript functionality
export const getTranscriptAdvanced = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { videoName, includeMetadata = false } = req.body;

      // Validate inputs
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Valid course ID is required", 400));
      }

      // Get course with transcript data
      const result = await getCourseWithTranscript(id, videoName);
      
      if (!result.course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      // Build response based on requirements
      const responseData: any = {
        courseId: id,
        courseName: result.course.name,
        courseDescription: result.course.description
      };

      // Add video-specific data if found
      if (videoName) {
        responseData.videoName = videoName;
        responseData.videoFound = result.hasVideo;
        
        if (result.videoData) {
          responseData.videoData = {
            title: result.videoData.title,
            description: result.videoData.description,
            duration: result.videoData.videoLength,
            // Add transcript data if available
            transcript: result.videoData.transcript || null
          };
        }
      }

      // Add metadata if requested
      if (includeMetadata) {
        responseData.metadata = {
          requestedAt: new Date().toISOString(),
          totalSections: Array.isArray(result.course.courseData) ? result.course.courseData.length : 0,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        };
      }

      res.status(200).json({
        success: true,
        message: "Transcript data retrieved successfully",
        data: responseData
      });

    } catch (error: any) {
      console.error("Advanced transcript error:", {
        error: error.message,
        courseId: req.params?.id,
        videoName: req.body?.videoName,
        timestamp: new Date().toISOString()
      });

      return next(new ErrorHandler(error.message || "Failed to retrieve transcript", 500));
    }
  }
);