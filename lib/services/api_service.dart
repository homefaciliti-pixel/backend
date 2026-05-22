import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000';
    } else if (Platform.isAndroid) {
      // Connect to host machine localhost from Android emulator
      return 'http://10.0.2.2:3000';
    } else {
      return 'http://localhost:3000';
    }
  }

  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token") ?? prefs.getString("phone") ?? "";
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<dynamic> get(String path) async {
    try {
      final url = Uri.parse('$baseUrl$path');
      final headers = await _getHeaders();
      final response = await http.get(url, headers: headers);
      return _processResponse(response);
    } catch (e) {
      debugPrint("API GET Error [$path]: $e");
      rethrow;
    }
  }

  static Future<dynamic> post(String path, Map<String, dynamic> body) async {
    try {
      final url = Uri.parse('$baseUrl$path');
      final headers = await _getHeaders();
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
      return _processResponse(response);
    } catch (e) {
      debugPrint("API POST Error [$path]: $e");
      rethrow;
    }
  }

  static Future<dynamic> put(String path, Map<String, dynamic> body) async {
    try {
      final url = Uri.parse('$baseUrl$path');
      final headers = await _getHeaders();
      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode(body),
      );
      return _processResponse(response);
    } catch (e) {
      debugPrint("API PUT Error [$path]: $e");
      rethrow;
    }
  }

  static dynamic _processResponse(http.Response response) {
    final statusCode = response.statusCode;
    final bodyString = response.body;

    if (statusCode >= 200 && statusCode < 300) {
      if (bodyString.isEmpty) return null;
      return jsonDecode(bodyString);
    } else {
      Map<String, dynamic>? errorJson;
      try {
        errorJson = jsonDecode(bodyString);
      } catch (_) {}
      final errorMsg = errorJson?['error'] ?? 'API request failed with code $statusCode';
      throw HttpException(errorMsg);
    }
  }
}
