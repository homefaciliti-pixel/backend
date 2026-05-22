class UserModel {
  String name;
  String phone;
  String email;
  String location;
  String locality;
  String gender;
  final String referralCode;

  UserModel({
    required this.name,
    required this.phone,
    required this.email,
    required this.location,
    required this.locality,
    required this.gender,
    required this.referralCode,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'] ?? '',
      location: json['location'] ?? '',
      locality: json['locality'] ?? '',
      gender: json['gender'] ?? 'Male',
      referralCode: json['referralCode'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'phone': phone,
      'email': email,
      'location': location,
      'locality': locality,
      'gender': gender,
      'referralCode': referralCode,
    };
  }
}