import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class SearchProvider extends ChangeNotifier {
  bool isLoading = false;
  String error = '';
  List<Map<String, dynamic>> searchResults = [];

  Future<void> searchServices(String query) async {
    final trimmedQuery = query.trim();

    error = '';
    searchResults = [];

    if (trimmedQuery.isEmpty) {
      notifyListeners();
      return;
    }

    isLoading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/search?q=$trimmedQuery",
        ),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);

        List<dynamic> rawList = [];

        if (decoded is Map<String, dynamic>) {
          final candidates = [
            decoded["data"],
            decoded["services"],
            decoded["results"],
            decoded["list"],
            decoded["items"],
          ];

          for (final candidate in candidates) {
            if (candidate is List) {
              rawList = candidate;
              break;
            }
          }
        }

        searchResults = rawList.whereType<Map<String, dynamic>>().toList();
      } else {
        error = "Failed to load search results";
      }
    } catch (e) {
      error = e.toString();
    }

    isLoading = false;
    notifyListeners();
  }
}