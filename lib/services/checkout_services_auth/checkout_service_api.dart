import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../viewmodel/checkout_model.dart';

//import '../../model/checkout_model.dart';

class CheckoutService {

  Future<CheckoutModel?> getCheckout({

    required String phone,
    required String token,
    String? productId,

  }) async {

    try {

      // Build URL – include productId query param when available so the
      // backend always returns the correct service instead of the
      // "Tap Repair" fallback.
      final baseUrl =
          "https://backend-1-ux3b.onrender.com/api/checkout-api/$phone";
      final uri = (productId != null && productId.isNotEmpty)
          ? Uri.parse(baseUrl)
              .replace(queryParameters: {"productId": productId})
          : Uri.parse(baseUrl);

      final response = await http.get(

        uri,

        headers: {

          "Authorization": "Bearer $token",

          "Content-Type": "application/json",
        },
      );

      if (response.statusCode == 200) {

        final data = jsonDecode(response.body);

        return CheckoutModel.fromJson(data);
      }

      return null;

    } catch (e) {

      print(e);

      return null;
    }
  }
}