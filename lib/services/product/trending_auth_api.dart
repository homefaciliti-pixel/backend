import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/tending_viewmodel.dart';

class TrendingServiceViewmodel extends ChangeNotifier {

  bool _loading = false;

  bool get loading => _loading;

  List<TrendingServiceModel> _services = [];

  List<TrendingServiceModel> get services => _services;

  // Hardcoded fallback trending services with live backend image URLs
  static final List<TrendingServiceModel> _fallbackTrending = [
    TrendingServiceModel(
      title: "AC Foam Jet Service",
      price: 499,
      description: "Deep clean your AC with professional foam jet technology.",
      image: "https://backend-1-ux3b.onrender.com/uploads/1782370871985-653299335.jpg",
      categoryId: "38",
      categoryName: "AC Repair",
    ),
    TrendingServiceModel(
      title: "2BHK Deep Cleaning",
      price: 999,
      description: "Complete home cleaning by professionals.",
      image: "https://backend-1-ux3b.onrender.com/uploads/1782379281899-302488180.jpg",
      categoryId: "7",
      categoryName: "Cleaning",
    ),
    TrendingServiceModel(
      title: "House Wiring Electrician",
      price: 699,
      description: "Expert electrician for all electrical needs.",
      image: "https://backend-1-ux3b.onrender.com/uploads/1782368297524-943557893.jpg",
      categoryId: "3",
      categoryName: "Electrician",
    ),
    TrendingServiceModel(
      title: "professional Plumber",
      price: 499,
      description: "Fix leaks, pipes and all plumbing issues.",
      image: "https://backend-1-ux3b.onrender.com/uploads/1782367898826-830124248.jpg",
      categoryId: "1",
      categoryName: "Plumber",
    ),
    TrendingServiceModel(
      title: "Women Haircut",
      price: 249,
      description: "Professional salon services at your doorstep.",
      image: "https://backend-1-ux3b.onrender.com/uploads/1782392839781-267721012.jpg",
      categoryId: "5",
      categoryName: "Salon",
    ),
  ];

  Future<void> fetchTrendingServices() async {

    _loading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse(
          'https://backend-1-ux3b.onrender.com/api/services/trending',
        ),
      ).timeout(const Duration(seconds: 45));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        final rawList = (data["services"] ?? data["data"]) as List?;
        if (rawList != null && rawList.isNotEmpty) {
          _services = rawList
              .map((e) => TrendingServiceModel.fromJson(e as Map<String, dynamic>))
              .toList();
        } else {
          _services = _fallbackTrending;
        }
      } else {
        _services = _fallbackTrending;
      }

    } catch (e) {

      print("TRENDING ERROR => $e");
      _services = _fallbackTrending;

    } finally {

      _loading = false;
      notifyListeners();
    }
  }
}