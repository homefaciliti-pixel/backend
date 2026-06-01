import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/tending_viewmodel.dart';
//import '../model/trending_service_model.dart';

class TrendingServiceViewmodel extends ChangeNotifier {

  bool _loading = false;

  bool get loading => _loading;

  List<TrendingServiceModel> _services = [];

  List<TrendingServiceModel> get services => _services;

  Future<void> fetchTrendingServices() async {

    _loading = true;
    notifyListeners();

    try {
      final response = await http.get(
        Uri.parse(
          'https://backend-1-ux3b.onrender.com/api/services/trending',
        ),
      );

      final data = jsonDecode(response.body);

      //print("TRENDING RESPONSE => $data");

      if (response.statusCode == 200 &&
          data["success"] == true) {

        _services = (data["services"] as List)
            .map(
              (e) => TrendingServiceModel.fromJson(e),
        )
            .toList();
      }

    } catch (e) {

      print("TRENDING ERROR => $e");

    } finally {

      _loading = false;
      notifyListeners();
    }
  }
}