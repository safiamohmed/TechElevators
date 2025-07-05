import { Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import CourseModel from "../models/course.model";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    // create document in courses collection
    const course = await CourseModel.create(data);
    // send the response
    res.status(201).json({
      success: true,
      course, //details of courses(ex: name of course , description , comments ,...)
    });
  }
);
// get all course service
export const getAllCoursesService = async (res: Response) => {
   //to find all courses and sort from newest to oldest
  const courses = await CourseModel.find().sort({ createdAt: -1 }); 
   // send the response
  res.status(201).json({
    success: true,
    courses,
  });
};
