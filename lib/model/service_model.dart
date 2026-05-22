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
}