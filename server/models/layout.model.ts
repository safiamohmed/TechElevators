import { Schema, model, Document } from "mongoose";

export interface FaqItem extends Document {
  question: string;
  answer: string;
}

export interface Category extends Document {
  title: string;
}

export interface BannerImage extends Document {
  public_id: string;
  url: string;
}

export interface Blog extends Document {
  title: string;
  date: string;
  author: string;
  comments: number;
  content: string;
  image: BannerImage;
  category: string; 
}

interface Layout extends Document {
  type: string;
  faq: FaqItem[];
  categories: Category[];
  banner: {
    image: BannerImage;
    title: string;
    subTitle: string;
  };
  blogs: Blog[]; // إضافة حقل المقالات
}

const faqSchema = new Schema<FaqItem>({
  question: { type: String },
  answer: { type: String },
});

const categorySchema = new Schema<Category>({
  title: { type: String },
});

const bannerImageSchema = new Schema<BannerImage>({
  public_id: { type: String },
  url: { type: String },
});

const blogSchema = new Schema<Blog>({
  title: { type: String, required: true },
  date: { type: String, required: true },
  author: { type: String, required: true },
  comments: { type: Number, default: 0 },
  content: { type: String, required: true },
  image: bannerImageSchema,
  category: { type: String, required: true },
});

const layoutSchema = new Schema<Layout>({
  type: { type: String },
  faq: [faqSchema],
  categories: [categorySchema],
  banner: {
    image: bannerImageSchema,
    title: { type: String },
    subTitle: { type: String },
  },
  blogs: [blogSchema], 
});

const LayoutModel = model<Layout>("Layout", layoutSchema);

export default LayoutModel;