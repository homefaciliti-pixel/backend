class AddressModel {
  final String type; // Home / Office / Other
  final String houseNo;
  final String society;
  final String floor;
  final String landmark;
  final String city;
  final String locality;
  final String pincode;
  final double? latitude;
  final double? longitude;

  AddressModel({
    required this.type,
    required this.houseNo,
    required this.society,
    required this.floor,
    required this.landmark,
    required this.city,
    required this.locality,
    required this.pincode,
    this.latitude,
    this.longitude,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      type: json['type'] ?? 'Home',
      houseNo: json['houseNo'] ?? '',
      society: json['society'] ?? '',
      floor: json['floor'] ?? '',
      landmark: json['landmark'] ?? '',
      city: json['city'] ?? '',
      locality: json['locality'] ?? '',
      pincode: json['pincode'] ?? '',
      latitude: json['latitude'] is num ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] is num ? (json['longitude'] as num).toDouble() : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'houseNo': houseNo,
      'society': society,
      'floor': floor,
      'landmark': landmark,
      'city': city,
      'locality': locality,
      'pincode': pincode,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    };
  }
}