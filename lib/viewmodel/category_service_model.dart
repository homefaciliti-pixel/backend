class CategoryServiceModel {
  final String title;
  final int price;
  final String description;
  final String image;

  CategoryServiceModel({
    required this.title,
    required this.price,
    required this.description,
    required this.image,
  });

  factory CategoryServiceModel.fromJson(Map<String, dynamic> json) {
    return CategoryServiceModel(
      title: (json['title'] ?? json['name'])?.toString() ?? '',
      price: json['price'] is num
          ? (json['price'] as num).toInt()
          : int.tryParse(json['price']?.toString() ?? '0') ?? 0,
      description: json['description']?.toString() ?? '',
      image: (json['image'] ?? json['serviceImage'] ?? json['photo'] ?? json['url'])?.toString() ?? '',
    );
  }
}