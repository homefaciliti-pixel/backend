import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../viewmodel/checkout_model.dart';

class CheckoutService {

  Future<CheckoutModel?> getCheckout({
    required String phone,
    required String token,
    required String status,
  }) async {

    try {

      // status is the productId/service name selected by user
      final cleanPhone = (phone.isNotEmpty) ? phone : "me";
      final baseUrl =
          "https://backend-1-ux3b.onrender.com/api/checkout-api/$cleanPhone";
      final uri = status.isNotEmpty
          ? Uri.parse(baseUrl)
              .replace(queryParameters: {"productId": status})
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