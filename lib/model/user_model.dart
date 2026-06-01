class UserModel {
  String name;
  String phone;
  String email;
  String location;
  String locality;
  String gender;
  String token;
  // referral


  final String referralCode;
  UserModel({

   required this.name,
    required this.phone,
   required this.email,
    required this.location,
    required this.locality,
    required this.gender,
    required this.referralCode,
    required this.token
});
}