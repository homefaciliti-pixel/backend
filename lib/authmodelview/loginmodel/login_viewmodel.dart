// import 'package:flutter/material.dart';
// import '../../services/login/login_auth.dart';
// //import '../services/auth_service.dart';
//
// class AuthViewmodel extends ChangeNotifier {
//   final AuthService _authService = AuthService();
//   bool _isLoading = false;
//
//   bool get isLoading => _isLoading;
//
//   Future<bool> sendOtp({
//     required String phone,
//     required String countryCode,
//   }) async {
//     _isLoading = true;
//     notifyListeners();
//
//     try {
//       final response = await _authService.sendOtp(
//         phone: phone,
//         countryCode: countryCode,
//       );
//
//       return response["success"];
//     } finally {
//       _isLoading = false;
//       notifyListeners();
//     }
//   }
//
//   // Existing referral code method
//   Future<bool> applyReferralCode(String code) async {
//     await Future.delayed(const Duration(seconds: 1));
//     return code.toUpperCase() == "WELCOME";
//   }
// }