class OrderModel {
  final int? id;
  final String serviceName;
  final int price;
  final String date;
  final String status; // Pending / completed

  OrderModel({
    this.id,
    required this.serviceName,
    required this.price,
    required this.date,
    required this.status,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'],
      serviceName: json['serviceName'] ?? '',
      price: json['price'] is int ? json['price'] : (json['price'] as num).toInt(),
      date: json['date'] ?? '',
      status: json['status'] ?? 'Pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceName': serviceName,
      'price': price,
      'date': date,
      'status': status,
    };
  }
}