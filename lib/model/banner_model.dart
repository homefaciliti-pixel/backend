class BannerModel {
  final String id;
  final String image;
  final String title;
  final String category;
  final String badge;
  final String subtitle;
  final String buttonText;

  BannerModel({
    required this.id,
    required this.image,
    required this.title,
    required this.category,
    this.badge = '',
    this.subtitle = '',
    this.buttonText = '',
  });

  factory BannerModel.fromJson(Map<String, dynamic> json) {
    return BannerModel(
      id: json['id'] ?? '',
      image: json['image'] ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? '',
      badge: json['badge'] ?? '',
      subtitle: json['subtitle'] ?? '',
      buttonText: json['buttonText'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'image': image,
      'title': title,
      'category': category,
      'badge': badge,
      'subtitle': subtitle,
      'buttonText': buttonText,
    };
  }
}
