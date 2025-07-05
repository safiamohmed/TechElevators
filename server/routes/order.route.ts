// routes/order.route.ts
import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { 
  createOrder, 
  getAllOrders, 
  newPayment, 
  sendStripePublishableKey,
  getUserOrders,
  getOrderById,
  checkOrdersCount,
  fixMissingCourses,
  checkCourseAccess
} from "../controller/order.controller";

export const orderRouter = express.Router();

// ============ Routes للطلبات ============

// إنشاء طلب جديد
orderRouter.post("/create-order", isAuthenticated, createOrder);

// الحصول على جميع الطلبات (للأدمن فقط)
orderRouter.get(
  "/get-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);

// الحصول على طلبات المستخدم الحالي
orderRouter.get("/get-user-orders", isAuthenticated, getUserOrders);

// الحصول على طلب معين بالـ ID
orderRouter.get("/get-order/:id", isAuthenticated, getOrderById);

// إحصائيات الطلبات (للأدمن)
orderRouter.get(
  "/orders-statistics", 
  isAuthenticated, 
  authorizeRoles("admin"), 
  checkOrdersCount
);

// ============ Routes للدفع ============

// Stripe publishable key
orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey);

// إنشاء payment intent
orderRouter.post("/payment", isAuthenticated, newPayment);
// في ملف الـ routes
orderRouter.get("/check-access/:courseId", isAuthenticated, checkCourseAccess);
orderRouter.post("/fix-missing-courses", isAuthenticated, fixMissingCourses);

export default orderRouter;