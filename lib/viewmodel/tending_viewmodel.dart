class TrendingServiceModel {
  final String title;
  final int price;
  final String description;
  final String image;
  final String categoryId;
  final String categoryName;

  TrendingServiceModel({
    required this.title,
    required this.price,
    required this.description,
    required this.image,
    this.categoryId = '',
    this.categoryName = '',
  });

  factory TrendingServiceModel.fromJson(
      Map<String, dynamic> json,
      ) {
    return TrendingServiceModel(
      title: (json["title"] ?? json["name"])?.toString() ?? "",
      price: json["price"] is num
          ? (json["price"] as num).toInt()
          : int.tryParse(json["price"]?.toString() ?? "0") ?? 0,
      description: json["description"]?.toString() ?? "",
      image: (json["image"] ?? json["imageUrl"] ?? json["photo"] ?? json["url"])?.toString() ?? "",
      categoryId: (json["categoryId"] ?? json["category_id"] ?? json["category"])?.toString() ?? "",
      categoryName: (json["categoryName"] ?? json["category_name"] ?? json["category"])?.toString() ?? "",
    );
  }
}