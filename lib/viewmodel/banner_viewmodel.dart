class BannerModel {
  final String id;
  final String image;
  final String title;
  final String category;

  BannerModel({
    required this.id,
    required this.image,
    required this.title,
    required this.category,
  });
  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id']?.toString() ?? '',
      image: (json['image'] ?? json['bannerImage'] ?? json['imageUrl'] ?? json['photo'] ?? json['url'])?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'image': image,
      'title': title,
      'category': category,
    };
  }
}