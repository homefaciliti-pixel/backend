class OrderModel {
  final int? id;
  final String serviceName;
  final int price;
  final String date;
  final String status; // Pending / completed
  final String? bookingStatus;
  final String? partnerName;
  final String? partnerDistance;
  final String? productId;
  final String? description;
  final String? timeSlot;

  OrderModel({
    this.id,
    required this.serviceName,
    required this.price,
    required this.date,
    required this.status,
    this.bookingStatus,
    this.partnerName,
    this.partnerDistance,
    this.productId,
    this.description,
    this.timeSlot,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'],
      serviceName: json['serviceName'] ?? '',
      price: json['price'] is int ? json['price'] : (json['price'] as num).toInt(),
      date: json['date'] ?? '',
      status: json['status'] ?? 'Pending',
      bookingStatus: json['bookingStatus'],
      partnerName: json['partnerName'],
      partnerDistance: json['partnerDistance'],
      productId: json['productId'],
      description: json['description'],
      timeSlot: json['timeSlot'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceName': serviceName,
      'price': price,
      'date': date,
      'status': status,
      if (bookingStatus != null) 'bookingStatus': bookingStatus,
      if (partnerName != null) 'partnerName': partnerName,
      if (partnerDistance != null) 'partnerDistance': partnerDistance,
      if (productId != null) 'productId': productId,
      if (description != null) 'description': description,
      if (timeSlot != null) 'timeSlot': timeSlot,
    };
  }
}