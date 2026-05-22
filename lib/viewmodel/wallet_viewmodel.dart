import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:userapp/services/api_service.dart';

class WalletViewmodel extends ChangeNotifier {
  double _balance = 0;
  double get balance => _balance;

  void setBalance(double amount) {
    _balance = amount;
    notifyListeners();
  }

  /// wallet load (app start pr)
  Future<void> loadWallet() async {
    try {
      final res = await ApiService.get('/api/wallet/balance');
      if (res['success'] == true) {
        _balance = (res['balance'] as num).toDouble();
      }
    } catch (e) {
      debugPrint("Failed to load wallet balance from backend: $e");
      // Fallback to local storage
      final prefs = await SharedPreferences.getInstance();
      _balance = prefs.getDouble("wallet") ?? 0;
    }
    notifyListeners();
  }

  /// money add
  Future<void> addMoney(double amount) async {
    try {
      final res = await ApiService.post('/api/wallet/add', {'amount': amount});
      if (res['success'] == true) {
        _balance = (res['balance'] as num).toDouble();
      }
    } catch (e) {
      debugPrint("Failed to add money on backend: $e");
      _balance += amount;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble("wallet", _balance);
    notifyListeners();
  }

  /// money deduct
  Future<void> deductMoney(double amount) async {
    try {
      final res = await ApiService.post('/api/wallet/deduct', {'amount': amount});
      if (res['success'] == true) {
        _balance = (res['balance'] as num).toDouble();
      }
    } catch (e) {
      debugPrint("Failed to deduct money on backend: $e");
      _balance -= amount;
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble("wallet", _balance);
    notifyListeners();
  }
}