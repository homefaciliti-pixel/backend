class CheckoutModel {

  final bool success;
  final int orderId;
  final String userId;

  final Product product;
  final Address address;
  final Payment payment;

  final String status;
  final String bookingStatus;
  final String? razorpayOrderId;

  CheckoutModel({
    required this.success,
    required this.orderId,
    required this.userId,
    required this.product,
    required this.address,
    required this.payment,
    required this.status,
    required this.bookingStatus,
    this.razorpayOrderId,
  });

  factory CheckoutModel.fromJson(Map<String, dynamic> json) {

    return CheckoutModel(

      success: json["success"],

      orderId: json["orderId"],

      userId: json["userId"],

      product: Product.fromJson(json["product"]),

      address: Address.fromJson(json["address"]),

      payment: Payment.fromJson(json["payment"]),

      status: json["status"],

      bookingStatus: json["bookingStatus"],

      razorpayOrderId: json["razorpayOrderId"],
    );
  }
}

class Product {

  final String productId;
  final String serviceName;
  final int price;
  final String description;
  final String date;
  final String timeSlot;

  Product({
    required this.productId,
    required this.serviceName,
    required this.price,
    required this.description,
    required this.date,
    required this.timeSlot,
  });

  factory Product.fromJson(Map<String, dynamic> json) {

    return Product(

      productId: json["productId"],

      serviceName: json["serviceName"],

      price: json["price"],

      description: json["description"],

      date: json["date"],

      timeSlot: json["timeSlot"],
    );
  }
}

class Address {
final String name;
final String altPhoneNumber;
  final String type;
  final String houseNo;
  final String society;
  final String floor;
  final String landmark;
  final String city;
  final String locality;
  final String pincode;

  Address({
    required this.name,
    required this.altPhoneNumber,
    required this.type,
    required this.houseNo,
    required this.society,
    required this.floor,
    required this.landmark,
    required this.city,
    required this.locality,
    required this.pincode,
  });

  factory Address.fromJson(Map<String, dynamic> json) {

    return Address(
name: json['name'],
      altPhoneNumber: json['alternateNumber'],
      type: json["type"],

      houseNo: json["houseNo"],

      society: json["society"],

      floor: json["floor"],

      landmark: json["landmark"],

      city: json["city"],

      locality: json["locality"],

      pincode: json["pincode"],
    );
  }
}

class Payment {

  final String paymentMethod;
  final int amountPaid;

  Payment({
    required this.paymentMethod,
    required this.amountPaid,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {

    return Payment(

      paymentMethod: json["paymentMethod"],

      amountPaid: json["amountPaid"],
    );
  }
}