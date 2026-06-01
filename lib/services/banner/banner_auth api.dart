import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../viewmodel/banner_viewmodel.dart';
//import '../model/banner_model.dart';

class BannerViewmodel extends ChangeNotifier {

  bool _loading = false;

  bool get loading => _loading;

  List<BannerModel> _banners = [];

  List<BannerModel> get banners => _banners;

  Future<void> fetchBanners() async {

    _loading = true;
    notifyListeners();

    try {

      final response = await http.get(
        Uri.parse(
          'https://backend-1-ux3b.onrender.com/api/banners',
        ),
      );

      final data = jsonDecode(response.body);

     // print("BANNER RESPONSE => $data");

      if (response.statusCode == 200 &&
          data["success"] == true) {

        _banners = (data["banners"] as List)
            .map(
              (e) => BannerModel.fromJson(e),
        )
            .toList();
      }

    } catch (e) {

      print("BANNER ERROR => $e");

    } finally {

      _loading = false;
      notifyListeners();
    }
  }

}