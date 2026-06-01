class TrendingServiceModel {
  final String title;
  final int price;
  final String description;
  final String image;

  TrendingServiceModel({
    required this.title,
    required this.price,
    required this.description,
    required this.image,
  });

  factory TrendingServiceModel.fromJson(
      Map<String, dynamic> json,
      ) {
    return TrendingServiceModel(
      title: json["title"] ?? "",
      price: json["price"] ?? 0,
      description: json["description"] ?? "",
      image: json["image"] ?? "",
    );
  }
}