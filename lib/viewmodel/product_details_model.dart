class ProductDetailModel {
  final String productId;
  final String title;
  final int price;
  final String description;
  final String image;
  final String category;
  final String duration;
  final double rating;
  final int reviewsCount;
  final List<String> highlights;

  ProductDetailModel({
    required this.productId,
    required this.title,
    required this.price,
    required this.description,
    required this.image,
    required this.category,
    required this.duration,
    required this.rating,
    required this.reviewsCount,
    required this.highlights,
  });

  factory ProductDetailModel.fromJson(Map<String, dynamic> json) {
    return ProductDetailModel(
      productId:json['productId']??'',
      title: json['title'] ?? '',
      price: json['price'] ?? 0,
      description: json['description'] ?? '',
      image: json['image'] ?? '',
      category: json['category'] ?? '',
      duration: json['duration'] ?? '',
      rating: (json['rating'] ?? 0).toDouble(),
      reviewsCount: json['reviewsCount'] ?? 0,
      highlights: List<String>.from(json['highlights'] ?? []),
    );
  }
}