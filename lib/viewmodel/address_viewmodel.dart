import 'package:flutter/material.dart';
import 'package:userapp/model/address_model.dart';
import 'package:userapp/services/api_service.dart';

class AddressViewmodel extends ChangeNotifier {
  String selectedType = "Home";
  AddressModel? address;

  List<String> states = [];
  List<String> cities = [];
  String? selectedState;
  String? selectedCity;
  bool isLoadingStates = false;
  bool isLoadingCities = false;

  void setType(String type) {
    selectedType = type;
    notifyListeners();
  }

  void saveAddress(AddressModel newAddress) {
    address = newAddress;
    notifyListeners();
  }

  Future<void> fetchStates() async {
    isLoadingStates = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/states');
      if (res != null && res['success'] == true) {
        states = List<String>.from(res['states']);
      }
    } catch (e) {
      debugPrint("Error fetching states: $e");
    } finally {
      isLoadingStates = false;
      notifyListeners();
    }
  }

  Future<void> fetchCities(String state) async {
    isLoadingCities = true;
    notifyListeners();
    try {
      final res = await ApiService.get('/api/cities?state=$state');
      if (res != null && res['success'] == true) {
        cities = List<String>.from(res['cities']);
      }
    } catch (e) {
      debugPrint("Error fetching cities for state $state: $e");
    } finally {
      isLoadingCities = false;
      notifyListeners();
    }
  }

  void selectState(String? state) {
    selectedState = state;
    selectedCity = null;
    cities = [];
    notifyListeners();
    if (state != null) {
      fetchCities(state);
    }
  }

  void selectCity(String? city) {
    selectedCity = city;
    notifyListeners();
  }
}