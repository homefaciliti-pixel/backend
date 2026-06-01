import 'dart:convert';
import 'package:http/http.dart' as http;

class AddressApiService {

  static Future<bool> saveAddress({


    required String token,

    required Map<String, dynamic> body,

  }) async {

    final url = Uri.parse(
      "https://backend-1-ux3b.onrender.com/api/address",
    );

    final response = await http.post(

      url,

      headers: {

        "Content-Type": "application/json",

        "Authorization": "Bearer $token",
      },

      body: jsonEncode(body),
    );
print("address>>>>>>>>>>>");
    print(response.body);

    if (response.statusCode == 200 ||
        response.statusCode == 201) {

      return true;
    }

    return false;
  }
}