// import 'package:flutter/material.dart';
// import 'package:userapp/model/address_model.dart';
//
// class AddressViewmodel extends ChangeNotifier{
//
//   String selectedType ="Home";
//
//   AddressModel? address;
//
//   void setType (String type){
//     selectedType =type;
//     notifyListeners();
//   }
//
//   void saveAddress(AddressModel newAddress){
//     address = newAddress;
//     notifyListeners();
//   }
// }
import 'package:flutter/material.dart';

import '../services/address/address_auth_api.dart';
//import 'address_auth_api.dart';
//mport '../services/address_api_service.dart';

class AddressViewmodel extends ChangeNotifier {

  String selectedType = "Home";

  bool loading = false;

  void setType(String type) {

    selectedType = type;

    notifyListeners();
  }

  Future<bool> saveAddressApi({

    required String token,

    required Map<String, dynamic> body,

  }) async {

    loading = true;

    notifyListeners();

    final success =
    await AddressApiService.saveAddress(

      token: token,

      body: body,
    );

    loading = false;

    notifyListeners();

    return success;
  }
}