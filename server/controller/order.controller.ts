// ============ order.controller.ts - كامل ومحدث مع جميع الدوال ============
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import { IOrder } from "../models/order.model";

import OrderModel from "../models/order.model";
import userModel from "../models/user.model";
import CourseModel, { ICourse } from "../models/course.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { 
  getAllOrdersService, 
  createOrderInDB, 
  getOrdersStatistics,
  getOrdersByUserService,
  getOrderByIdService 
} from "../services/order.service";
import { redis } from "../utils/redis";

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// ============ Create Order Controller - نسخة محدثة ============
// إضافة دالة للتحقق من البيانات وتنظيفها
const validateAndSanitizeOrderData = (requestBody: any, userId: string) => {
  const { courseId, payment_info, courseData } = requestBody;
  
  // التحقق من البيانات الأساسية
  if (!courseId) {
    throw new Error("courseId is required");
  }
  
  if (!payment_info) {
    throw new Error("payment_info is required");
  }

  // معالجة courseData إذا كان موجوداً
  let sanitizedCourseData = [];
  if (courseData && Array.isArray(courseData)) {
    sanitizedCourseData = courseData.map((course: any) => {
      if (!course.questions || !Array.isArray(course.questions)) {
        return { questions: [] };
      }
      
      const sanitizedQuestions = course.questions.map((question: any) => {
        return {
          user: question.user || userId, // استخدام userId الحالي كافتراضي
          options: question.options || {},
          title: question.title || "",
          content: question.content || "",
          answers: question.answers || []
        };
      });
      
      return {
        ...course,
        questions: sanitizedQuestions
      };
    });
  }

  return {
    courseId,
    userId,
    payment_info: {
      ...payment_info,
      type: payment_info.type || "stripe"
    },
    courseData: sanitizedCourseData
  };
};

// ============ order.controller.ts مع إصلاح مشكلة الـ TypeScript ============

import { Types } from 'mongoose';

// إضافة interface للكورس المعبأ
interface PopulatedCourse {
  _id: Types.ObjectId;
  name: string;
  price: number;
  purchased?: number;
  // أضف باقي خصائص الكورس حسب الحاجة
}

// إضافة interface للطلب المعبأ
interface PopulatedOrder {
  _id: Types.ObjectId;
  courseId: PopulatedCourse;
  userId: Types.ObjectId;
  payment_info: any;
  createdAt: Date;
  // أضف باقي خصائص الطلب حسب الحاجة
}

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      
      // التحقق من وجود المستخدم
      const user = await userModel.findById(req.user?._id);
      if (!user) return next(new ErrorHandler("User not found", 404));

      // تنظيف وتحقق البيانات
      let sanitizedData;
      try {
        sanitizedData = validateAndSanitizeOrderData(req.body, user._id.toString());
        console.log("Sanitized data:", JSON.stringify(sanitizedData, null, 2));
      } catch (validationError: any) {
        console.error("Validation error:", validationError.message);
        return next(new ErrorHandler(validationError.message, 400));
      }

      const { courseId, payment_info, courseData } = sanitizedData;

      // التحقق من وجود الكورس
      const course = await CourseModel.findById(courseId);
      if (!course) return next(new ErrorHandler("Course not found", 404));

      // التحقق من الكورس في المستخدم
      const courseExistInUser = user?.courses.some(
        (course: any) => course.courseId === courseId
      );
      
      if (courseExistInUser) {
        return next(
          new ErrorHandler("You have already enrolled in this course", 400)
        );
      }

      const isPaid = course.price && course.price > 0;

      // معالجة الكورسات المجانية
      if (!isPaid) {
        user.courses.push({ courseId: courseId });
        await user.save();
        
        // تحديث الكاش
        await redis.del(req.user?._id); 
        const updatedUser = await userModel.findById(req.user?._id);
        await redis.set(req.user?._id, JSON.stringify(updatedUser));

        // إنشاء طلب للكورس المجاني
        const freeOrder = new OrderModel({
          courseId: course._id,
          userId: user._id,
          payment_info: {
            id: "free_course_" + Date.now(),
            status: "completed",
            type: "free"
          },
          courseData: courseData || []
        });

        const savedOrder = await freeOrder.save();
        console.log("Free course order created:", savedOrder._id);

        // تحديث حقل purchased للكورس المجاني
        try {
          console.log("Before update - Course purchased count:", course.purchased);
          course.purchased = (course.purchased || 0) + 1;
          await course.save();
          console.log("After update - Course purchased count:", course.purchased);
          await redis.del(courseId); // مسح الكاش القديم
          // تحديث الكاش للكورس
          await redis.set(courseId, JSON.stringify(course), "EX", 604800);
        } catch (courseUpdateError: any) {
          console.error("Error updating course purchase count for free course:", courseUpdateError.message);
        }

        // إنشاء الإشعار
        await NotificationModel.create({
          user: user._id,
          title: "Free Course Enrolled",
          message: `You have been enrolled in the free course: ${course.name}`,
        });

        // إرسال إيميل تأكيد للكورس المجاني
        try {
          const mailData = {
            order: {
              _id: savedOrder._id.toString().slice(0, 6),
              name: course.name,
              price: 0,
              date: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              isPaid: false,
            },
          };

          await sendMail({
            email: user.email,
            subject: "Free Course Enrollment Confirmation",
            template: "order-confirmation.ejs",
            data: mailData,
          });
        } catch (emailError: any) {
          console.error("Email sending failed for free course:", emailError.message);
        }

        return res.status(200).json({
          success: true,
          message: "Enrolled in free course successfully",
          order: {
            id: savedOrder._id,
            courseId: course._id,
            courseName: course.name,
            price: 0,
            isPaid: false,
            purchaseDate: savedOrder.createdAt,
          }
        });
      }

      // معالجة الكورسات المدفوعة
      console.log("Processing paid course...");

      // التحقق من الدفع عبر Stripe
      if ("id" in payment_info && payment_info.type === "stripe") {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(payment_info.id);
          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler("Payment not authorized!", 400));
          }
          console.log("Payment verified successfully:", payment_info.id);
        } catch (stripeError: any) {
          console.error("Stripe verification error:", stripeError.message);
          return next(new ErrorHandler("Payment verification failed", 400));
        }
      }

      // إنشاء الطلب المدفوع
      const paidOrder = new OrderModel({
        courseId: course._id,
        userId: user._id,
        payment_info,
        courseData: courseData || []
      });

      const savedOrder = await paidOrder.save();
      console.log("Paid course order created:", savedOrder._id);

      // إضافة الكورس للمستخدم بعد تأكيد حفظ الطلب
      try {
        user.courses.push({ courseId: courseId });
        await user.save();
        
        // تحديث الكاش
        await redis.del(req.user?._id);
        const updatedUser = await userModel.findById(req.user?._id);
        await redis.set(req.user?._id, JSON.stringify(updatedUser));
        
        console.log("User courses updated successfully");
      } catch (userUpdateError: any) {
        console.error("Error updating user courses:", userUpdateError.message);
        await OrderModel.findByIdAndDelete(savedOrder._id);
        return next(new ErrorHandler("Failed to enroll user in course", 500));
      }

      // تحديث عدد المشترين
      try {
        console.log("Before update - Course purchased count:", course.purchased);
        course.purchased = (course.purchased || 0) + 1;
        await course.save();
        console.log("After update - Course purchased count:", course.purchased);
        // تحديث الكاش للكورس
        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      } catch (courseUpdateError: any) {
        console.error("Error updating course purchase count:", courseUpdateError.message);
      }

      // إنشاء الإشعار
      await NotificationModel.create({
        user: user._id,
        title: "New Order",
        message: `You have successfully purchased the course: ${course.name}`,
      });

      // إعداد بيانات الإيميل
      const mailData = {
        order: {
          _id: savedOrder._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          isPaid: true,
        },
        user: {
          name: user.name,
          email: user.email
        }
      };

      // إرسال إيميل تأكيد الطلب
      try {
        await sendMail({
          email: user.email,
          subject: "Order Confirmation",
          template: "order-confirmation.ejs",
          data: mailData,
        });
        console.log("Order confirmation email sent successfully");
      } catch (emailError: any) {
        console.error("Email sending failed:", emailError.message);
      }

      // إرسال الرد النهائي
      return res.status(201).json({
        success: true,
        message: "Course purchased successfully",
        order: {
          id: savedOrder._id,
          courseId: course._id,
          courseName: course.name,
          price: course.price,
          isPaid: true,
          purchaseDate: savedOrder.createdAt,
        },
        courseAccess: {
          canAccess: true,
          courseUrl: `/course/${course._id}`,
          totalCourses: user.courses.length + 1
        }
      });

    } catch (error: any) {
      console.error("Order creation error:", error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        return next(new ErrorHandler(`Validation Error: ${validationErrors.join(', ')}`, 400));
      }
      
      if (error.name === 'CastError') {
        return next(new ErrorHandler("Invalid ID format", 400));
      }
      
      if (error.code === 11000) {
        return next(new ErrorHandler("Duplicate order detected", 400));
      }
      
      return next(new ErrorHandler(error.message || "Internal server error", 500));
    }
  }
);

// ============ دالة للتحقق من وصول المستخدم للكورس ============
export const checkCourseAccess = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      // التحقق من الوصول باستخدام courseId string
      const hasAccess = user.courses.some((userCourse: any) => 
        userCourse.courseId === courseId
      );
      
      let orderExists = false;
      if (!hasAccess) {
        const order = await OrderModel.findOne({
          userId: userId,
          courseId: courseId,
          'payment_info.status': { $in: ['succeeded', 'completed'] }
        });
        orderExists = !!order;
      }
      
      const isPaid = course.price > 0;
      
      return res.status(200).json({
        success: true,
        hasAccess: hasAccess || orderExists,
        courseInfo: {
          id: course._id,
          name: course.name,
          price: course.price,
          isPaid: isPaid
        },
        accessDetails: {
          inUserCourses: hasAccess,
          hasValidOrder: orderExists,
          needsPurchase: !hasAccess && !orderExists && isPaid
        }
      });
      
    } catch (error: any) {
      console.error("Error checking course access:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ دالة لإصلاح الكورسات المفقودة ============
export const fixMissingCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      // 🔥 الحل الأول: استخدام PopulatedOrder interface
      const completedOrders = await OrderModel.find({
        userId: userId,
        'payment_info.status': { $in: ['succeeded', 'completed'] }
      }).populate('courseId') as PopulatedOrder[];
      
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      
      let addedCourses = 0;
      
      for (const order of completedOrders) {
        // الآن يمكن الوصول لـ order.courseId.name بدون مشاكل
        const courseId = order.courseId._id.toString();
        
        const courseExists = user.courses.some((userCourse: any) => 
          userCourse.courseId === courseId
        );
        
        if (!courseExists) {
          user.courses.push({ courseId: courseId });
          addedCourses++;
          console.log(`Added missing course: ${order.courseId.name}`);
        }
      }
      
      if (addedCourses > 0) {
        await user.save();
        
        // تحديث الكاش
        await redis.del(userId);
        const updatedUser = await userModel.findById(userId);
        await redis.set(userId, JSON.stringify(updatedUser));
        
        console.log(`Fixed ${addedCourses} missing courses for user ${userId}`);
      }
      
      return res.status(200).json({
        success: true,
        message: `Fixed ${addedCourses} missing courses`,
        addedCourses: addedCourses,
        totalCourses: user.courses.length
      });
      
    } catch (error: any) {
      console.error("Error fixing missing courses:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ دالة للحصول على تفاصيل الطلب ============
export const getOrderDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      // 🔥 الحل الثاني: Type assertion مع التحقق
      const order = await OrderModel.findOne({
        _id: orderId,
        userId: userId
      }).populate('courseId') as PopulatedOrder | null;
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }
      
      // التحقق من أن courseId هو object وليس string
      if (!order.courseId || typeof order.courseId === 'string') {
        return next(new ErrorHandler("Course data not properly loaded", 500));
      }
      
      const course = order.courseId;
      const isPaid = course.price > 0;
      
      return res.status(200).json({
        success: true,
        order: {
          id: order._id,
          courseId: course._id,
          courseName: course.name,
          price: course.price,
          isPaid: isPaid,
          purchaseDate: order.createdAt,
          paymentStatus: order.payment_info?.status || 'unknown',
          paymentType: order.payment_info?.type || 'unknown'
        }
      });
      
    } catch (error: any) {
      console.error("Error getting order details:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ دالة بديلة باستخدام الطريقة الآمنة ============
export const getOrderDetailsAlternative = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?._id;
      
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      // 🔥 الحل الثالث: جلب البيانات منفصلة
      const order = await OrderModel.findOne({
        _id: orderId,
        userId: userId
      });
      
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }
      
      // جلب الكورس منفصل
      const course = await CourseModel.findById(order.courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      
      const isPaid = course.price > 0;
      
      return res.status(200).json({
        success: true,
        order: {
          id: order._id,
          courseId: course._id,
          courseName: course.name,
          price: course.price,
          isPaid: isPaid,
          purchaseDate: order.createdAt,
          paymentStatus: order.payment_info?.status || 'unknown',
          paymentType: order.payment_info?.type || 'unknown'
        }
      });
      
    } catch (error: any) {
      console.error("Error getting order details:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// ============ Get all orders (admin) ============
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("🔍 Fetching all orders for admin dashboard...");
      
      // إضافة pagination إذا كان مطلوب
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // الحصول على العدد الكلي
      const totalOrders = await OrderModel.countDocuments();
      
      // جلب الطلبات مع البيانات الصحيحة
      const orders = await OrderModel.find()
        .populate({
          path: 'courseId',
          select: 'name price thumbnail duration level category',
          options: { lean: true }
        })
        .populate({
          path: 'userId', 
          select: 'name email avatar',
          options: { lean: true }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // تنظيف البيانات
      const cleanedOrders = orders.map(order => {
        const courseData = order.courseId as any;
        const userData = order.userId as any;
        
        return {
          _id: order._id,
          // بيانات الكورس
          course: {
            id: courseData?._id || null,
            name: courseData?.name || 'Unknown Course',
            price: courseData?.price || 0,
            thumbnail: courseData?.thumbnail || null,
            duration: courseData?.duration || null,
            level: courseData?.level || null,
            category: courseData?.category || null
          },
          // بيانات المستخدم
          user: {
            id: userData?._id || null,
            name: userData?.name || 'Unknown User',
            email: userData?.email || 'Unknown Email',
            avatar: userData?.avatar || null
          },
          // بيانات الدفع
          payment: {
            id: order.payment_info?.id || 'N/A',
            status: order.payment_info?.status || 'unknown',
            type: order.payment_info?.type || 'unknown'
          },
          // بيانات إضافية
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          isPaid: (courseData?.price || 0) > 0,
          // للتوافق مع الكود القديم
          courseId: courseData?._id || null,
          courseName: courseData?.name || 'Unknown Course',
          coursePrice: courseData?.price || 0,
          userId: userData?._id || null,
          userName: userData?.name || 'Unknown User',
          userEmail: userData?.email || 'Unknown Email'
        };
      });

      console.log(`✅ Successfully fetched ${cleanedOrders.length} orders`);
      
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        data: {
          orders: cleanedOrders,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders: totalOrders,
            hasNext: page < Math.ceil(totalOrders / limit),
            hasPrev: page > 1
          }
        },
        // للتوافق مع الكود القديم
        count: cleanedOrders.length,
        orders: cleanedOrders
      });

    } catch (error: any) {
      console.error("❌ Error in getAllOrders:", error);
      return next(new ErrorHandler(error.message || "Failed to fetch orders", 500));
    }
  }
);


// ============ الحصول على طلبات مستخدم معين ============
export const getUserOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("User not authenticated", 401));
      }
      
      console.log("Fetching orders for user:", userId);
      await getOrdersByUserService(res, userId);
    } catch (error: any) {
      console.error("Error fetching user orders:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ الحصول على طلب معين بالـ ID ============
export const getOrderById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      if (!orderId) {
        return next(new ErrorHandler("Order ID is required", 400));
      }
      
      console.log("Fetching order by ID:", orderId);
      await getOrderByIdService(res, orderId);
    } catch (error: any) {
      console.error("Error fetching order by ID:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ دالة للتحقق من الطلبات (للديباجنج) ============
export const checkOrdersCount = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Checking orders statistics...");
      const statistics = await getOrdersStatistics();
      
      return res.status(200).json({
        success: true,
        message: "Orders statistics retrieved successfully",
        data: statistics
      });
    } catch (error: any) {
      console.error("Error checking orders count:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ Send Stripe publishable key ============
export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!process.env.STRIPE_PUBLISHABLE_KEY) {
        return next(new ErrorHandler("Stripe publishable key not configured", 500));
      }

      res.status(200).json({
        success: true,
        publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error: any) {
      console.error("Error sending Stripe key:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ Create Stripe payment intent ============
export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return next(new ErrorHandler("Valid amount is required", 400));
      }

      console.log("Creating payment intent for amount:", amount);
      
      const myPayment = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // تحويل للسنت
        currency: "usd",
        metadata: {
          company: "TechElevators",
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: 'Course Purchase',
        shipping: {
          name: "Customer",
          address: {
            line1: "Address Line 1",
            city: "City",
            country: "US",
            postal_code: "12345",
          },
        },
      });

      console.log("Payment intent created:", myPayment.id);

      res.status(201).json({
        success: true,
        message: "Payment intent created successfully",
        client_secret: myPayment.client_secret,
        payment_intent_id: myPayment.id,
      });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// ============ دوال إضافية مفيدة ============

// إلغاء طلب (إذا كان مطلوباً)
export const cancelOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.id;
      const userId = req.user?._id;

      const order = await OrderModel.findOne({ _id: orderId, userId });
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // يمكنك إضافة منطق إلغاء الطلب هنا
      // مثل استرداد الأموال عبر Stripe

      res.status(200).json({
        success: true,
        message: "Order cancellation request received",
        orderId: orderId
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// الحصول على آخر الطلبات
export const getRecentOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      console.log(`🔍 Fetching ${limit} recent orders...`);
      
      const recentOrders = await OrderModel.find()
        .populate({
          path: 'courseId',
          select: 'name price thumbnail',
          options: { lean: true }
        })
        .populate({
          path: 'userId',
          select: 'name email avatar',
          options: { lean: true }
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      const cleanedOrders = recentOrders.map(order => {
        const courseData = order.courseId as any;
        const userData = order.userId as any;
        
        return {
          _id: order._id,
          course: {
            id: courseData?._id || null,
            name: courseData?.name || 'Unknown Course',
            price: courseData?.price || 0,
            thumbnail: courseData?.thumbnail || null
          },
          user: {
            id: userData?._id || null,
            name: userData?.name || 'Unknown User',
            email: userData?.email || 'Unknown Email',
            avatar: userData?.avatar || null
          },
          payment: {
            status: order.payment_info?.status || 'unknown',
            type: order.payment_info?.type || 'unknown'
          },
          createdAt: order.createdAt,
          isPaid: (courseData?.price || 0) > 0
        };
      });

      console.log(`✅ Successfully fetched ${cleanedOrders.length} recent orders`);

      res.status(200).json({
        success: true,
        message: "Recent orders fetched successfully",
        count: cleanedOrders.length,
        orders: cleanedOrders,
      });
    } catch (error: any) {
      console.error("❌ Error in getRecentOrders:", error);
      return next(new ErrorHandler(error.message || "Failed to fetch recent orders", 500));
    }
  }
);

export const debugOrdersData = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("🔍 Starting orders data debugging...");
      
      // عدة طرق للتحقق من البيانات
      const totalOrders = await OrderModel.countDocuments();
      console.log(`📊 Total orders: ${totalOrders}`);
      
      // أول طلب بدون populate
      const firstOrderRaw = await OrderModel.findOne().lean();
      console.log("📄 First order (raw):", JSON.stringify(firstOrderRaw, null, 2));
      
      // أول طلب مع populate
      const firstOrderPopulated = await OrderModel.findOne()
        .populate('courseId')
        .populate('userId')
        .lean();
      console.log("📄 First order (populated):", JSON.stringify(firstOrderPopulated, null, 2));
      
      // فحص الـ references
      const ordersWithMissingCourses = await OrderModel.find({
        courseId: { $exists: false }
      }).countDocuments();
      
      const ordersWithMissingUsers = await OrderModel.find({
        userId: { $exists: false }
      }).countDocuments();
      
      console.log(`⚠️ Orders with missing courses: ${ordersWithMissingCourses}`);
      console.log(`⚠️ Orders with missing users: ${ordersWithMissingUsers}`);
      
      res.status(200).json({
        success: true,
        debug: {
          totalOrders,
          ordersWithMissingCourses,
          ordersWithMissingUsers,
          firstOrderRaw,
          firstOrderPopulated
        }
      });
    } catch (error: any) {
      console.error("❌ Error in debugOrdersData:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);