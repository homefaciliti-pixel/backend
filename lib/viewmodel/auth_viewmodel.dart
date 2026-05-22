import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:userapp/model/user_model.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';

class AuthViewmodel extends ChangeNotifier {


  String generateReferralCode(String name){
    return name.substring(0, 3).toUpperCase()+
    DateTime.now().millisecondsSinceEpoch.toString().substring(7);
  }

  bool _isLoggedIn = false;

  bool get isLoggedIn => _isLoggedIn;

  ///  USER DATA
  late UserModel user = UserModel(
    name: "Hira",
    phone: "8504920167",
    email: "hira@hmail.com",
    location: "",
    locality: "",
    gender: "Male",
    referralCode:"",
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

      user = UserModel(
        name: prefs.getString("name") ?? "Hira",
        phone: prefs.getString("phone") ?? "",
        email: prefs.getString("email") ?? "",
        location: prefs.getString("location") ?? "",
        locality: prefs.getString("locality") ?? "",
        gender: prefs.getString("gender") ?? "Male",
        referralCode: '',
      );

      notifyListeners();
    }
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

}