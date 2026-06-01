// import 'dart:convert';
// import 'package:http/http.dart' as http;
//
// class AuthService {
//   static const String baseUrl =
//       'https://backend-8onr.onrender.com/api/auth';
//
//   Future<Map<String, dynamic>> sendOtp({
//     required String phone,
//     required String countryCode,
//   }) async {
//     try {
//       final response = await http.post(
//         Uri.parse('$baseUrl/send-otp'),
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: jsonEncode({
//           "phone": phone,
//           "countryCode": countryCode,
//         }),
//       );
//
//       final data = jsonDecode(response.body);
//
//       if (response.statusCode == 200 ||
//           response.statusCode == 201) {
//         return {
//           "success": true,
//           "message": data["message"] ?? "OTP sent successfully",
//           "data": data,
//         };
//       } else {
//         return {
//           "success": false,
//           "message": data["message"] ?? "Something went wrong",
//         };
//       }
//     } catch (e) {
//       return {
//         "success": false,
//         "message": e.toString(),
//       };
//     }
//   }
// }