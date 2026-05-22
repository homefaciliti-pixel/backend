import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WalletViewmodel extends ChangeNotifier{

  double _balance =0;
  double get balance => _balance;

  /// wallet load (app start pr)


Future<void> loadWallet()async{
  final prefs = await SharedPreferences.getInstance();
  _balance =prefs.getDouble("wallet") ??0;
  notifyListeners();
}

                   ///money add

Future<void> addMoney(double amount)async {
  _balance += amount;

  final prefs =await SharedPreferences.getInstance();
  await prefs.setDouble("wallet", _balance);
  notifyListeners();
}

      /// money deduct

Future<void> deductMoney(double amount )async{
  _balance -= amount;


  final prefs =await SharedPreferences.getInstance();
  await prefs.setDouble("wallet", _balance);
  notifyListeners();
}
}