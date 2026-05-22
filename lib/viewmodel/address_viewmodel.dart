import 'package:flutter/material.dart';
import 'package:userapp/model/address_model.dart';

class AddressViewmodel extends ChangeNotifier{

  String selectedType ="Home";

  AddressModel? address;

  void setType (String type){
    selectedType =type;
    notifyListeners();
  }

  void saveAddress(AddressModel newAddress){
    address = newAddress;
    notifyListeners();
  }
}