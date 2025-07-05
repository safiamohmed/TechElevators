import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import LayoutModel from "../models/layout.model";
import cloudinary from "cloudinary";

export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeExist = await LayoutModel.findOne({ type });
      if (isTypeExist) {
        return next(new ErrorHandler(`${type} already exist`, 400));
      }
      if (type === "Banner") {
        const { image, title, subTitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });
        const banner = {
          type: "Banner",
          banner: {
            image: {
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
            },
            title,
            subTitle,
          },
        };
        await LayoutModel.create(banner);
      }
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return { question: item.question, answer: item.answer };
          })
        );
        await LayoutModel.create({ type: "FAQ", faq: faqItems });
      }
      if (type === "Categories") {
        const { categories } = req.body;
        const categoriesItems = await Promise.all(
          categories.map(async (item: any) => {
            return { title: item.title };
          })
        );
        await LayoutModel.create({
          type: "Categories",
          categories: categoriesItems,
        });
      }
      if (type === "Blogs") {
        const { blogs } = req.body;
        const blogItems = await Promise.all(
          blogs.map(async (item: any) => {
            const myCloud = await cloudinary.v2.uploader.upload(item.image, {
              folder: "blogs",
            });
            return {
              title: item.title,
              date: item.date,
              author: item.author,
              comments: item.comments || 0,
              content: item.content,
              image: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
              },
            };
          })
        );
        await LayoutModel.create({ type: "Blogs", blogs: blogItems });
      }
      res.status(200).json({
        success: true,
        message: "Layout created successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      if (type === "Banner") {
        const { image, title, subTitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: "layout",
        });
        const bannerData = await LayoutModel.findOne({ type: "Banner" });
        const banner = {
          type: "Banner",
          banner: {
            image: {
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
            },
            title,
            subTitle,
          },
        };
        if (bannerData) {
          await LayoutModel.findByIdAndUpdate(bannerData._id, banner, { new: true });
        } else {
          await LayoutModel.create(banner);
        }
      }
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        let layout = await LayoutModel.findOne({ type: "FAQ" });
        if (!layout) {
          layout = await LayoutModel.create({ type: "FAQ", faq: faqItems });
        } else {
          await LayoutModel.findByIdAndUpdate(layout._id, { faq: faqItems }, { new: true });
        }
      }
      if (type === "Categories") {
        const { categories } = req.body;
        const categoriesData = await LayoutModel.findOne({ type: "Categories" });
        const categoriesItems = await Promise.all(
          categories.map(async (item: any) => {
            return { title: item.title };
          })
        );
        if (!categoriesData) {
          await LayoutModel.create({ type: "Categories", categories: categoriesItems });
        } else {
          await LayoutModel.findByIdAndUpdate(categoriesData._id, { categories: categoriesItems }, { new: true });
        }
      }
      if (type === "Blogs") {
        const { blogs } = req.body;
        const blogItems = await Promise.all(
          blogs.map(async (item: any) => {
            let image = item.image;
            // لو الصورة جاية كـ URL مباشرة
            if (image && typeof image === "string" && !image.startsWith("data:image")) {
              image = { url: image }; // تحويل لـ object
            } else if (image && typeof image === "string" && image.startsWith("data:image")) {
              const myCloud = await cloudinary.v2.uploader.upload(item.image, {
                folder: "blogs",
              });
              image = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
              };
            }

            return {
              title: item.title || "Untitled",
              date: item.date || new Date().toISOString().split("T")[0], // String format
              author: item.author || "Unknown",
              comments: item.comments || 0,
              content: item.content || "",
              image: image || { url: "/assests/placeholder.jpg" },
              category: item.category || "Uncategorized",
            };
          })
        );
        let layout = await LayoutModel.findOne({ type: "Blogs" });
        if (!layout) {
          layout = await LayoutModel.create({ type: "Blogs", blogs: blogItems });
        } else {
          await LayoutModel.findByIdAndUpdate(layout._id, { blogs: blogItems }, { new: true });
        }
      }
      res.status(200).json({
        success: true,
        message: "Layout updated successfully!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getLayoutByType = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const layout = await LayoutModel.findOne({ type });
      if (!layout) {
        return next(new ErrorHandler("Invalid type", 400));
      }
      res.status(201).json({
        success: true,
        layout,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);