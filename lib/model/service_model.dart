class ServiceModel {
  final String title;
  final String? image; // nullable
  final int price;
  final String description;

  ServiceModel({
    required this.title,
    this.image,
    required this.price,
    required this.description,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      title: json['title'] ?? '',
      image: json['image'],
      price: json['price'] is int ? json['price'] : (json['price'] as num).toInt(),
      description: json['description'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'image': image,
      'price': price,
      'description': description,
    };
  }
}