export class ReviewHelper {
  // حساب متوسط التقييم
  static calculateAverageRating(reviews: any[]): number {
    if (!reviews || reviews.length === 0) return 0;
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 100) / 100; // تقريب لمنزلتين عشريتين
  }

  // حساب توزيع التقييمات
  static calculateRatingDistribution(reviews: any[]): number[] {
    const distribution = [0, 0, 0, 0, 0]; // [1 نجمة, 2 نجمة, 3 نجمة, 4 نجمة, 5 نجمة]
    
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    
    return distribution;
  }

  // فلترة وترتيب المراجعات
  static sortReviews(reviews: any[], sortBy: string = 'createdAt', sortOrder: string = 'desc'): any[] {
    return reviews.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // التعامل مع التواريخ
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'desc') {
        return bValue - aValue;
      }
      return aValue - bValue;
    });
  }

  // تقسيم المراجعات لصفحات
  static paginateReviews(reviews: any[], page: number = 1, limit: number = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      reviews: reviews.slice(startIndex, endIndex),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(reviews.length / limit),
        totalReviews: reviews.length,
        hasNextPage: endIndex < reviews.length,
        hasPrevPage: page > 1,
        limit
      }
    };
  }
}
