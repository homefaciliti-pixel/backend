import 'package:flutter/material.dart';

class LocationViewModel extends ChangeNotifier {

  String? selectedState;
  String? selectedCity;
  String? selectedLocality;

  Map<String, List<String>> states = {
    "Rajasthan": ["Jaipur", "Jodhpur"],
    "Gujarat": ["Ahmedabad", "Surat"],
  };

  Map<String, List<String>> localities = {
    "Jaipur": ["Vaishali Nagar","Mansrovar", "Malviya Nagar"],
    "Jodhpur": ["Ratanada", "Shastri Nagar"],
  };

  void selectState(String state) {
    selectedState = state;
    selectedCity = null;
    notifyListeners();
  }

  void selectCity(String city) {
    selectedCity = city;
    notifyListeners();
  }

  void selectLocality(String loc) {
    selectedLocality = loc;
    notifyListeners();
  }
}