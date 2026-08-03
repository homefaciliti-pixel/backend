import 'package:flutter/material.dart';
import 'checkout_service_api.dart';
import '../../viewmodel/checkout_model.dart';

class CheckoutViewModel extends ChangeNotifier {
  CheckoutModel? _checkoutModel;
  bool _loading = false;

  CheckoutModel? get checkoutModel => _checkoutModel;
  bool get loading => _loading;

  Future<void> fetchCheckout({
    required String phone,
    required String token,
    String? productId,
  }) async {
    _loading = true;
    notifyListeners();

    try {
      final result = await CheckoutService().getCheckout(
        phone: phone,
        token: token,
        productId: productId,
      );
      _checkoutModel = result;
    } catch (e) {
      debugPrint('CheckoutViewModel fetchCheckout error: $e');
      _checkoutModel = null;
    }

    _loading = false;
    notifyListeners();
  }

  void clear() {
    _checkoutModel = null;
    _loading = false;
    notifyListeners();
  }
}
