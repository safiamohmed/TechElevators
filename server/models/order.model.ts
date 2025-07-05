import mongoose, { Document, Model, Schema } from "mongoose";

interface PaymentInfo {
  id: string;
  status: string;
  type: string;
}

// إضافة interface للسؤال
interface IQuestion {
  user: mongoose.Types.ObjectId;
  options?: any; // أو نوع أكثر تحديداً حسب احتياجاتك
  // إضافة المزيد من الحقول حسب الحاجة
  title?: string;
  content?: string;
  answers?: any[];
}

// إضافة interface لبيانات الكورس
interface ICourseData {
  questions: IQuestion[];
  // إضافة المزيد من الحقول حسب الحاجة
  title?: string;
  description?: string;
}

// تحديث IOrder لتشمل courseData اختيارياً
export interface IOrder extends Document {
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  payment_info: PaymentInfo;
  price: number;
  courseName?: string;
  courseData?: ICourseData[]; // إضافة courseData كحقل اختياري
  createdAt: Date;
  updatedAt: Date;
}

// تحديث المخطط
const questionSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  options: {
    type: Schema.Types.Mixed,
    default: {}
  },
  title: { type: String },
  content: { type: String },
  answers: [Schema.Types.Mixed]
});

const courseDataSchema = new Schema({
  questions: [questionSchema],
  title: { type: String },
  description: { type: String }
});

const orderSchema = new Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payment_info: {
      id: { type: String, required: true },
      status: { type: String, required: true },
      type: { type: String, required: true },
    },
    // إضافة حقل price المفقود
   
    // إضافة courseName كحقل اختياري
    courseName: {
      type: String,
      required: false
    },
    // إضافة courseData كحقل اختياري
    courseData: {
      type: [courseDataSchema],
      required: false,
      default: []
    }
  },
  { timestamps: true }
);

const OrderModel = mongoose.model<IOrder>("Order", orderSchema);

export default OrderModel;