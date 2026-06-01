import 'package:flutter/material.dart';

import '../../viewmodel/checkout_model.dart';
import 'checkout_service_api.dart';

// import '../model/checkout_model.dart';
// import '../services/checkout/checkout_service.dart';

class CheckoutViewModel extends ChangeNotifier {

  final CheckoutService _service = CheckoutService();

  CheckoutModel? checkoutModel;

  bool loading = false;

  Future<void> fetchCheckout({

    required String phone,
    required String token,

  }) async {

    loading = true;

    notifyListeners();

    checkoutModel = await _service.getCheckout(

      phone: phone,
      token: token,
    );

    loading = false;

    notifyListeners();
  }
}