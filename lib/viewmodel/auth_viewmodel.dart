import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:userapp/model/user_model.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';

class AuthViewmodel extends ChangeNotifier {


  String generateReferralCode(String name){
    return name.substring(0, 3).toUpperCase()+
    DateTime.now().millisecondsSinceEpoch.toString().substring(7);
  }
  Future<bool> sendOtp({
    required String phone,
    required String countryCode,
  }) async {
    _loading = true;
    _message = null;
    notifyListeners();

    try {
      final body = {
        "phone": phone,
        "countryCode": countryCode,
      };

      print("BODY => ${jsonEncode(body)}");

      final response = await http.post(
        Uri.parse(
          'https://backend-8onr.onrender.com/api/auth/send-otp',
        ),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      debugPrint("SEND OTP RESPONSE : $data");

      if (response.statusCode == 200 ||
          response.statusCode == 201) {
        _message =
            data["message"] ?? "OTP sent successfully";

        return true;
      } else {
        _message =
            data["message"] ?? "Failed to send OTP";

        return false;
      }
    } catch (e) {
      debugPrint("SEND OTP ERROR : $e");

      _message = "Something went wrong";

      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
  Future<bool> verifyOtp({
    required String phone,
    required String otp,
    required String countryCode,
  }) async {
    _loading = true;
    _message = null;
    notifyListeners();

    try {
      final body = {
        "phone": phone,
        "otp": otp,
        "countryCode": countryCode,
      };

      print("VERIFY OTP BODY => ${jsonEncode(body)}");

      final response = await http.post(
        Uri.parse(
          'https://backend-8onr.onrender.com/api/auth/verify-otp',
        ),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      print("VERIFY OTP RESPONSE => $data");

      if (response.statusCode == 200 &&
          data["success"] == true) {

        // save token
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString(
          "token",
          data["token"] ?? "",
        );

        // save login state
        await prefs.setBool("isLogin", true);

        // save user data
        final userData = data["user"];

        user = UserModel(
          name: userData["name"] ?? "",
          phone: userData["phone"] ?? "",
          email: userData["email"] ?? "",
          location: userData["location"] ?? "",
          locality: userData["locality"] ?? "",
          gender: userData["gender"] ?? "",
          token: userData["token"] ?? '',
          referralCode: userData["referralCode"] ?? "",
        );

        // Save user fields to SharedPreferences
        await prefs.setString("name", user.name);
        await prefs.setString("phone", user.phone);
        await prefs.setString("email", user.email);
        await prefs.setString("location", user.location);
        await prefs.setString("locality", user.locality);
        await prefs.setString("gender", user.gender);
        await prefs.setString("refCode", user.referralCode);

        _isLoggedIn = true;

        _message =
            data["message"] ??
                "OTP verified successfully";

        notifyListeners();

        return true;
      } else {
        _message =
            data["message"] ?? "Invalid OTP";

        return false;
      }
    } catch (e) {
      print("VERIFY OTP ERROR => $e");

      _message = "Something went wrong";

      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
  //
  // Future<bool> sendOtp(
  //
  //     {required String phone,required String countryCode}
  //
  //     ) async {
  //   _loading = true;
  //   _message = null;
  //   notifyListeners();
  //
  //   try {
  //     final response = await http.post(
  //       Uri.parse(
  //         'https://backend-8onr.onrender.com/api/auth/send-otp',
  //       ),
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: jsonEncode({
  //         "phone": phone,
  //         "countryCode": countryCode,
  //       }),
  //         print("BODY => ${jsonEncode(body)}");
  //     );
  //
  //     final data = jsonDecode(response.body);
  //
  //     debugPrint("SEND OTP RESPONSE : $data");
  //
  //     if (response.statusCode == 200 ||
  //         response.statusCode == 201) {
  //       _message =
  //           data["message"] ?? "OTP sent successfully";
  //
  //       return true;
  //     } else {
  //       _message =
  //           data["message"] ?? "Failed to send OTP";
  //
  //       return false;
  //     }
  //   } catch (e) {
  //     debugPrint("SEND OTP ERROR : $e");
  //
  //     _message = "Something went wrong";
  //
  //     return false;
  //   } finally {
  //     _loading = false;
  //     notifyListeners();
  //   }
  // }
  bool _loading = false;
  bool get loading => _loading;

  String? _message;
  String? get message => _message;

  bool _isLoggedIn = false;

  bool get isLoggedIn => _isLoggedIn;

  ///  USER DATA
  late UserModel user = UserModel(
    name: "",
    phone: "",
    email: "",
    location: "",
    locality: "",
    gender: "",
    referralCode:"",
    token: "",
  );

  ///  LOGIN SAVE
  Future<void> login() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool("isLogin", true);

    _isLoggedIn = true;
    notifyListeners();
  }

  ///  CHECK LOGIN
  Future<void> checkLogin() async {
    final prefs = await SharedPreferences.getInstance();
    _isLoggedIn = prefs.getBool("isLogin") ?? false;

    notifyListeners();
  }

  ///  LOGOUT
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool("isLogin", false);

    _isLoggedIn = false;
    notifyListeners();
  }

  ///  UPDATE USER (only memory)
  ///
  void updateUser(UserModel newUser) {
    user = newUser;
    notifyListeners();
  }

  /// SAVE USER (SharedPreferences)
  Future<void> saveUser(UserModel userData) async {
    user = userData;

    final prefs = await SharedPreferences.getInstance();

    await prefs.setString("name", user.name);
    await prefs.setString("phone", user.phone);
    await prefs.setString("email", user.email);
    await prefs.setString("location", user.location);
    await prefs.setString("locality", user.locality);
    await prefs.setString("gender", user.gender);

                    // referralcode saved
    await prefs.setString("refCode", user.referralCode);
    await prefs.setString("token", user.token);


    notifyListeners();
  }

  ///  LOAD USER (App start pe)
  Future<void> loadUser() async {
    final prefs = await SharedPreferences.getInstance();

    /// check phle se referral code save h kaya ...
    String? savedCode = prefs.getString("refCode");

    //     agar nahi h to first time generate kro
    if (savedCode == null || savedCode.isEmpty) {
      savedCode = generateReferralCode("Hira");

      // save kr dete h taki next time same rhe
      await prefs.setString("refCode", savedCode);
    }

    user = UserModel(
      name: prefs.getString("name") ?? "Hira",
      phone: prefs.getString("phone") ?? "",
      email: prefs.getString("email") ?? "",
      location: prefs.getString("location") ?? "",
      locality: prefs.getString("locality") ?? "",
      gender: prefs.getString("gender") ?? "Male",
      referralCode: savedCode ?? "",
      token: prefs.getString("token") ?? "",
    );

    notifyListeners();
  }



       // add money in payment

  String? appliedReferralCode;


    /// yaha future me API lagegi (verify + reward)

  void applyReferral(String code , BuildContext context){
    appliedReferralCode =code;
    final walletVm=
        Provider.of<WalletViewmodel>(context, listen: false);
    walletVm.addMoney(50);           /// referral reward
    notifyListeners();

                       /// Future : Api yha lgegi
  }

         // refer code

  Future<bool> applyReferralCode(String code) async {
    try {
      // yaha backend API call hogi
      // example: repository se request bhejna

      await Future.delayed(const Duration(seconds: 1));

      // success/failure backend response ke hisaab se return karo
      return true;
    } catch (e) {
      return false;
    }
  }

}