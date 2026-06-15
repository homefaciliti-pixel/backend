import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/tending_viewmodel.dart';

class TrendingServiceViewmodel extends ChangeNotifier {

  bool _loading = false;

  bool get loading => _loading;

  List<TrendingServiceModel> _services = [];

  List<TrendingServiceModel> get services => _services;

  // Hardcoded fallback trending services
  static final List<TrendingServiceModel> _fallbackTrending = [
    TrendingServiceModel(
      title: "AC Foam Jet Service",
      price: 0,
      description: "Deep clean your AC with professional foam jet technology.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=60",
    ),
    TrendingServiceModel(
      title: "Home Deep Cleaning",
      price: 999,
      description: "Complete home cleaning by professionals.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=60",
    ),
    TrendingServiceModel(
      title: "Electrician Service",
      price: 199,
      description: "Expert electrician for all electrical needs.",
      image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=60",
    ),
    TrendingServiceModel(
      title: "Plumbing Service",
      price: 299,
      description: "Fix leaks, pipes and all plumbing issues.",
      image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=60",
    ),
    TrendingServiceModel(
      title: "Salon At Home",
      price: 299,
      description: "Professional salon services at your doorstep.",
      image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400&auto=format&fit=crop&q=60",
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
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data["success"] == true) {
        final List<TrendingServiceModel> fetched = (data["services"] as List)
            .map((e) => TrendingServiceModel.fromJson(e))
            .toList();

        if (fetched.isNotEmpty) {
          _services = fetched;
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