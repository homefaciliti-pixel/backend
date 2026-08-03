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
    int idVal = 0;
    if (json["orderId"] is int) {
      idVal = json["orderId"];
    } else if (json["orderId"] != null) {
      idVal = int.tryParse(json["orderId"].toString()) ?? 0;
    }

    return CheckoutModel(
      success: json["success"] == true || json["success"] == "true",
      orderId: idVal,
      userId: (json["userId"] ?? "").toString(),
      product: Product.fromJson(json["product"] is Map<String, dynamic> ? json["product"] : {}),
      address: Address.fromJson(json["address"] is Map<String, dynamic> ? json["address"] : {}),
      payment: Payment.fromJson(json["payment"] is Map<String, dynamic> ? json["payment"] : {}),
      status: (json["status"] ?? "Pending").toString(),
      bookingStatus: (json["bookingStatus"] ?? "draft").toString(),
      razorpayOrderId: json["razorpayOrderId"]?.toString(),
    );
  }
}

class Product {

  final String productId;
  final String serviceName;
  final int price;
  final String description;
  final String image;
  final String date;
  final String timeSlot;

  Product({
    required this.productId,
    required this.serviceName,
    required this.price,
    required this.description,
    required this.image,
    required this.date,
    required this.timeSlot,
  });

  factory Product.fromJson(Map<String, dynamic>? json) {
    json ??= {};
    String rawTitle = (json["serviceName"] ?? json["title"] ?? json["name"] ?? json["productName"] ?? json["productId"] ?? "").toString().trim();
    if (rawTitle.isEmpty || rawTitle == "0" || rawTitle == "null" || rawTitle == "undefined") {
      rawTitle = (json["productId"] ?? json["title"] ?? "Service").toString().trim();
      if (rawTitle == "0" || rawTitle == "null" || rawTitle == "undefined") rawTitle = "Service";
    }

    int priceVal = 0;
    if (json["price"] is int) {
      priceVal = json["price"];
    } else if (json["price"] is double) {
      priceVal = (json["price"] as double).toInt();
    } else if (json["price"] != null) {
      priceVal = int.tryParse(json["price"].toString()) ?? 0;
    }

    return Product(
      productId: (json["productId"] ?? rawTitle).toString(),
      serviceName: rawTitle,
      price: priceVal,
      description: (json["description"] ?? json["productDescription"] ?? "").toString(),
      image: (json["image"] ?? "").toString(),
      date: (json["date"] ?? "").toString(),
      timeSlot: (json["timeSlot"] ?? "").toString(),
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

  factory Address.fromJson(Map<String, dynamic>? json) {
    json ??= {};
    return Address(
      name: (json['name'] ?? "").toString(),
      altPhoneNumber: (json['alternateNumber'] ?? json['altPhoneNumber'] ?? "").toString(),
      type: (json["type"] ?? "Home").toString(),
      houseNo: (json["houseNo"] ?? "").toString(),
      society: (json["society"] ?? "").toString(),
      floor: (json["floor"] ?? "").toString(),
      landmark: (json["landmark"] ?? "").toString(),
      city: (json["city"] ?? "").toString(),
      locality: (json["locality"] ?? "").toString(),
      pincode: (json["pincode"] ?? "").toString(),
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

  factory Payment.fromJson(Map<String, dynamic>? json) {
    json ??= {};
    int amt = 0;
    if (json["amountPaid"] is int) {
      amt = json["amountPaid"];
    } else if (json["amountPaid"] is double) {
      amt = (json["amountPaid"] as double).toInt();
    } else if (json["amountPaid"] != null) {
      amt = int.tryParse(json["amountPaid"].toString()) ?? 0;
    }

    return Payment(
      paymentMethod: (json["paymentMethod"] ?? "Online").toString(),
      amountPaid: amt,
    );
  }
}