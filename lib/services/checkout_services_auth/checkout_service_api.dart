import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../viewmodel/checkout_model.dart';

//import '../../model/checkout_model.dart';

class CheckoutService {

  Future<CheckoutModel?> getCheckout({

    required String phone,
    required String token,

  }) async {

    try {

      final response = await http.get(

        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/checkout-api/$phone",
        ),

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