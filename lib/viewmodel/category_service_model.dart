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
      title: json['title'] ?? '',
      price: json['price'] ?? 0,
      description: json['description'] ?? '',
      image: json['image'] ?? '',
    );
  }
}