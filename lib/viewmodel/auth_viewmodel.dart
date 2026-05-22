import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:userapp/model/user_model.dart';
import 'package:userapp/services/api_service.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';

class AuthViewmodel extends ChangeNotifier {
  String generateReferralCode(String name) {
    return name.substring(0, 3).toUpperCase() +
        DateTime.now().millisecondsSinceEpoch.toString().substring(7);
  }

  bool _isLoggedIn = false;
  bool get isLoggedIn => _isLoggedIn;

  String tempPhone = "";

  UserModel user = UserModel(
    name: "Hira",
    phone: "",
    email: "hira@hmail.com",
    location: "",
    locality: "",
    gender: "Male",
    referralCode: "",
  );

  /// Send OTP to user
  Future<void> sendOtp(String phone) async {
    tempPhone = phone;
    await ApiService.post('/api/auth/send-otp', {'phone': phone});
  }

  /// Verify OTP
  Future<bool> verifyOtp(String otp) async {
    final res = await ApiService.post('/api/auth/verify-otp', {
      'phone': tempPhone.isNotEmpty ? tempPhone : "8504920167",
      'otp': otp,
    });

    if (res['success'] == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("phone", res['user']['phone']);
      if (res['token'] != null) {
        await prefs.setString("token", res['token']);
      }
      await prefs.setBool("isLogin", true);

      user = UserModel.fromJson(res['user']);
      _isLoggedIn = true;
      notifyListeners();
      return true;
    }
    return false;
  }

  /// MOCK LOGIN (legacy backup)
  Future<void> login() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool("isLogin", true);
    if (user.phone.isEmpty) {
      user.phone = "8504920167";
      await prefs.setString("phone", user.phone);
    }
    _isLoggedIn = true;
    notifyListeners();
  }

  /// CHECK LOGIN
  Future<void> checkLogin() async {
    final prefs = await SharedPreferences.getInstance();
    _isLoggedIn = prefs.getBool("isLogin") ?? false;
    if (_isLoggedIn) {
      await loadUser();
    }
    notifyListeners();
  }

  /// LOGOUT
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool("isLogin", false);
    await prefs.remove("phone");
    await prefs.remove("token");

    _isLoggedIn = false;
    notifyListeners();
  }

  /// UPDATE USER (only memory)
  void updateUser(UserModel newUser) {
    user = newUser;
    notifyListeners();
  }

  /// SAVE USER (Backend & SharedPreferences)
  Future<void> saveUser(UserModel userData) async {
    user = userData;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString("name", user.name);
    await prefs.setString("phone", user.phone);
    await prefs.setString("email", user.email);
    await prefs.setString("location", user.location);
    await prefs.setString("locality", user.locality);
    await prefs.setString("gender", user.gender);
    await prefs.setString("refCode", user.referralCode);

    // Call update API on backend
    try {
      final res = await ApiService.put('/api/auth/profile', user.toJson());
      if (res['success'] == true) {
        user = UserModel.fromJson(res['user']);
      }
    } catch (e) {
      debugPrint("Failed to sync profile changes with server: $e");
    }

    notifyListeners();
  }

  /// LOAD USER (App start)
  Future<void> loadUser() async {
    final prefs = await SharedPreferences.getInstance();
    String? phone = prefs.getString("phone");

    if (phone != null && phone.isNotEmpty) {
      try {
        final res = await ApiService.get('/api/auth/profile');
        if (res['success'] == true) {
          user = UserModel.fromJson(res['user']);
          _isLoggedIn = true;
          notifyListeners();
          return;
        }
      } catch (e) {
        debugPrint("Failed to load profile from backend: $e");
      }
    }

    // Fallback if backend loading fails or no phone stored
    String? savedCode = prefs.getString("refCode");
    if (savedCode == null || savedCode.isEmpty) {
      savedCode = generateReferralCode("Hira");
      await prefs.setString("refCode", savedCode);
    }

    user = UserModel(
      name: prefs.getString("name") ?? "Hira",
      phone: prefs.getString("phone") ?? "",
      email: prefs.getString("email") ?? "",
      location: prefs.getString("location") ?? "",
      locality: prefs.getString("locality") ?? "",
      gender: prefs.getString("gender") ?? "Male",
      referralCode: savedCode,
    );

    notifyListeners();
  }

  String? appliedReferralCode;

  /// Apply Referral Code
  Future<void> applyReferral(String code, BuildContext context) async {
    try {
      final res = await ApiService.post('/api/referrals/apply', {'code': code});
      if (res['success'] == true) {
        appliedReferralCode = code;
        final newBalance = (res['newBalance'] as num).toDouble();
        
        final walletVm = Provider.of<WalletViewmodel>(context, listen: false);
        walletVm.setBalance(newBalance);
        
        notifyListeners();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? "Referral code applied successfully!")),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Referral Error: $e")),
      );
    }
  }
}