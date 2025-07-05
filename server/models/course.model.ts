import mongoose, { Document, Model, Schema } from "mongoose";
import { IUser } from "./user.model";

export interface IThumbnail {
  public_id: string;
  url: string;
}

export interface IVideo {
  public_id: string;
  url: string;
  title?: string;
  duration?: number;
  storageType?: 'cloudinary' | 'database';
}

export interface IComment extends Document {
  user: IUser;
  question: string;
  questionReplies: IComment[];
}

// إضافة interface للردود على المراجعات
export interface ICommentReply {
  user: IUser;
  comment: string;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReview extends Document {
  user: IUser;
  review: string; // النص الأساسي للمراجعة
  rating?: number;
  commentReplies?: ICommentReply[]; // الردود على المراجعة
  attachments?: string[]; // إضافة المرفقات
  createdAt?: Date;
  updatedAt?: Date;
}

interface ILink extends Document {
  title: string;
  url: string;
}

export interface IReplyData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export interface IFileUploadResult {
  success: boolean;
  filePaths?: string[];
  error?: string;
}

export interface IPaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: string;
}

// تعريف واجهة Segment
export interface ISegment {
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  segments: ISegment[];
  language: string;
  summary?: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoPublicId?: string;
  storageType?: string;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IComment[];
  transcript: ISegment[];
  language: string; // Add language field
  summary?: string;
}

export interface ICourse extends Document {
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  isPaid: boolean;
  thumbnail: IThumbnail;
  video: IVideo[];
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased: number;
}

const reviewSchema = new Schema<IReview>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    required: true,
  },
  review: { // تغيير من comment إلى review
    type: String,
    required: true,
  },
  attachments: [{ // إضافة المرفقات
    type: String,
  }],
  commentReplies: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
      attachments: [{ // إضافة المرفقات للردود
        type: String,
      }],
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });

const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});

const commentSchema = new Schema<IComment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  question: String,
  questionReplies: [Object],
}, { timestamps: true });

const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  videoThumbnail: Object,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  videoPlayer: String,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
  transcript: [{  // تعريف كـ Array من Objects
        text: { type: String },
        start: { type: Number },
        end: { type: Number }
      }],
  language: { type: String, default: 'unknown' }, // إضافة حقل اللغة // Add language field
  summary: { type: String },
});

const courseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  categories: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  estimatedPrice: {
    type: Number,
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },
  video: [{ // تصحيح: المفروض يكون array
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
    title: String,
    duration: Number,
    storageType: {
      type: String,
      enum: ['cloudinary', 'database'],
    },
  }],
  tags: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  demoUrl: {
    type: String,
  },
  benefits: [{ title: String }],
  prerequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  ratings: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
export default CourseModel;