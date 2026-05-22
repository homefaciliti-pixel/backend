class AddressModel {
  final String type; // Home / Office / Other
  final String houseNo;
  final String society;
  final String floor;
  final String landmark;
  final String city;
  final String locality;
  final String pincode;

  AddressModel({
    required this.type,
    required this.houseNo,
    required this.society,
    required this.floor,
    required this.landmark,
    required this.city,
    required this.locality,
    required this.pincode,
  });
}