class ServiceModel {
  final String title;
  final String? image; // nullable
  final int price;
  final String description;
  final int? discount;
  final double? rating;
  final int? reviewsCount;
  final int? cutPrice;

  ServiceModel({
    required this.title,
    this.image,
    required this.price,
    required this.description,
    this.discount,
    this.rating,
    this.reviewsCount,
    this.cutPrice,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      title: json['title'] ?? '',
      image: json['image'],
      price: json['price'] is int ? json['price'] : (json['price'] as num).toInt(),
      description: json['description'] ?? '',
      discount: json['discount'] is int ? json['discount'] : (json['discount'] as num?)?.toInt(),
      rating: json['rating'] is double ? json['rating'] : (json['rating'] as num?)?.toDouble(),
      reviewsCount: json['reviewsCount'] is int ? json['reviewsCount'] : (json['reviewsCount'] as num?)?.toInt(),
      cutPrice: json['cutPrice'] is int ? json['cutPrice'] : (json['cutPrice'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'image': image,
      'price': price,
      'description': description,
      'discount': discount,
      'rating': rating,
      'reviewsCount': reviewsCount,
      'cutPrice': cutPrice,
    };
  }
}