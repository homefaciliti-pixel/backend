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
      id: json['id'] ?? '',
      image: json['image'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? '',
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