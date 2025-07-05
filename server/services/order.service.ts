
import { Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import OrderModel from "../models/order.model";
import ErrorHandler from "../utils/ErrorHandler";


export const createOrderInDB = async (data: any) => {
  try {
    console.log("Service: Creating order with data:", data);
    const order = await OrderModel.create(data);
    console.log("Service: Order created successfully with ID:", order._id);
    return order;
  } catch (error: any) {
    console.error("Service: Order creation failed:", error.message);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

export const newOrder = CatchAsyncError(async (data: any, res: Response, next: NextFunction) => {
  try {
    const order = await OrderModel.create(data);
    return order;
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
});

export const getAllOrdersService = async (res: Response) => {
  try {
    // 🔥 الحل الصحيح: استخدام lean() مع populate
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
      .lean(); // مهم جداً: lean() يرجع plain objects

    // تنظيف البيانات قبل الإرسال
    const cleanedOrders = orders.map(order => {
      const courseData = order.courseId as any;
      const userData = order.userId as any;
      
      return {
        _id: order._id,
        courseId: courseData?._id || null,
        courseName: courseData?.name || 'Unknown Course',
        coursePrice: courseData?.price || 0,
        courseThumbnail: courseData?.thumbnail || null,
        userId: userData?._id || null,
        userName: userData?.name || 'Unknown User',
        userEmail: userData?.email || 'Unknown Email',
        userAvatar: userData?.avatar || null,
        paymentInfo: {
          id: order.payment_info?.id || 'N/A',
          status: order.payment_info?.status || 'unknown',
          type: order.payment_info?.type || 'unknown'
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };
    });

    console.log("Orders fetched successfully:", cleanedOrders.length);
    
    res.status(200).json({
      success: true,
      count: cleanedOrders.length,
      orders: cleanedOrders,
    });
  } catch (error: any) {
    console.error("Error in getAllOrdersService:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching orders"
    });
  }
};


// الحصول على الطلب باستخدام الـ id
export const getOrderByIdService = async (res: Response, orderId: string) => {
  try {
    const order = await OrderModel.findById(orderId)
      .populate({
        path: 'courseId',
        select: 'name price thumbnail duration level category description',
        options: { lean: true }
      })
      .populate({
        path: 'userId',
        select: 'name email avatar',
        options: { lean: true }
      })
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const courseData = order.courseId as any;
    const userData = order.userId as any;

    const cleanedOrder = {
      _id: order._id,
      courseId: courseData?._id || null,
      courseName: courseData?.name || 'Unknown Course',
      coursePrice: courseData?.price || 0,
      courseThumbnail: courseData?.thumbnail || null,
      courseDescription: courseData?.description || null,
      userId: userData?._id || null,
      userName: userData?.name || 'Unknown User',
      userEmail: userData?.email || 'Unknown Email',
      userAvatar: userData?.avatar || null,
      paymentInfo: {
        id: order.payment_info?.id || 'N/A',
        status: order.payment_info?.status || 'unknown',
        type: order.payment_info?.type || 'unknown'
      },
      courseData: order.courseData || [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isPaid: (courseData?.price || 0) > 0
    };

    console.log("Order details fetched successfully:", orderId);
    
    res.status(200).json({
      success: true,
      order: cleanedOrder,
    });
  } catch (error: any) {
    console.error("Error in getOrderByIdService:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching order details"
    });
  }
};

// الطلبات الخاصة بمستخدم معين
export const getOrdersByUserService = async (res: Response, userId: string) => {
  try {
    const orders = await OrderModel.find({ userId })
      .populate({
        path: 'courseId',
        select: 'name price thumbnail duration level category',
        options: { lean: true }
      })
      .sort({ createdAt: -1 })
      .lean();

    const cleanedOrders = orders.map(order => {
      const courseData = order.courseId as any;
      
      return {
        _id: order._id,
        courseId: courseData?._id || null,
        courseName: courseData?.name || 'Unknown Course',
        coursePrice: courseData?.price || 0,
        courseThumbnail: courseData?.thumbnail || null,
        paymentInfo: {
          id: order.payment_info?.id || 'N/A',
          status: order.payment_info?.status || 'unknown',
          type: order.payment_info?.type || 'unknown'
        },
        createdAt: order.createdAt,
        isPaid: (courseData?.price || 0) > 0
      };
    });

    console.log(`User orders fetched: ${cleanedOrders.length} orders for user ${userId}`);
    
    res.status(200).json({
      success: true,
      count: cleanedOrders.length,
      orders: cleanedOrders,
    });
  } catch (error: any) {
    console.error("Error in getOrdersByUserService:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching user orders"
    });
  }
};


// دالة مساعدة للتحقق من وجود طلب
export const checkOrderExists = async (userId: string, courseId: string) => {
  try {
    const existingOrder = await OrderModel.findOne({ userId, courseId });
    return !!existingOrder;
  } catch (error) {
    console.error("Service: Error checking order existence:", error);
    return false;
  }
};

// دالة للحصول على إحصائيات الطلبات
export const getOrdersStatistics = async () => {
  try {
    const totalOrders = await OrderModel.countDocuments();
    const paidOrders = await OrderModel.countDocuments({
      'payment_info.status': { $in: ['succeeded', 'completed'] }
    });
    const freeOrders = await OrderModel.countDocuments({
      'payment_info.type': 'free'
    });
    
    // إحصائيات الدخل
    const revenueResult = await OrderModel.aggregate([
      {
        $match: {
          'payment_info.status': { $in: ['succeeded', 'completed'] },
          'payment_info.type': { $ne: 'free' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $unwind: '$course'
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$course.price' },
          averageOrderValue: { $avg: '$course.price' }
        }
      }
    ]);

    const revenue = revenueResult[0] || { totalRevenue: 0, averageOrderValue: 0 };

    // أحدث الطلبات
    const recentOrders = await OrderModel.find()
      .populate('courseId', 'name price')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const cleanedRecentOrders = recentOrders.map(order => {
      const courseData = order.courseId as any;
      const userData = order.userId as any;
      
      return {
        _id: order._id,
        courseName: courseData?.name || 'Unknown Course',
        coursePrice: courseData?.price || 0,
        userName: userData?.name || 'Unknown User',
        createdAt: order.createdAt,
        paymentStatus: order.payment_info?.status || 'unknown'
      };
    });

    return {
      totalOrders,
      paidOrders,
      freeOrders,
      totalRevenue: revenue.totalRevenue,
      averageOrderValue: Math.round(revenue.averageOrderValue * 100) / 100,
      recentOrders: cleanedRecentOrders,
      conversionRate: totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100 * 100) / 100 : 0
    };
  } catch (error: any) {
    console.error("Error getting orders statistics:", error);
    throw new Error("Failed to get orders statistics");
  }
};


// دالة للحصول على أحدث الطلبات
export const getRecentOrders = async (limit: number = 10) => {
  try {
    const recentOrders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "courseId",
        select: "name price"
      })
      .populate({
        path: "userId",
        select: "name email"
      });

    return recentOrders;
  } catch (error: any) {
    throw new Error(`Failed to get recent orders: ${error.message}`);
  }
};

// دالة لحذف طلب (للأدمن)
export const deleteOrderService = async (orderId: string) => {
  try {
    const deletedOrder = await OrderModel.findByIdAndDelete(orderId);
    
    if (!deletedOrder) {
      throw new Error("Order not found");
    }
    
    return deletedOrder;
  } catch (error: any) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
};