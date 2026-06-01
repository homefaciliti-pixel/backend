class OrderListModel {
  final int id;
  final String serviceName;
  final int price;
  final String status;
  final String bookingStatus;
  final String date;

  OrderListModel({
    required this.id,
    required this.serviceName,
    required this.price,
    required this.status,
    required this.bookingStatus,
    required this.date,
  });

  factory OrderListModel.fromJson(Map<String, dynamic> json) {
    return OrderListModel(
      id: json['id'] ?? 0,
      serviceName: json['serviceName'] ?? '',
      price: json['price'] ?? 0,
      status: json['status'] ?? '',
      bookingStatus: json['bookingStatus'] ?? '',
      date: json['date'] ?? '',
    );
  }
}