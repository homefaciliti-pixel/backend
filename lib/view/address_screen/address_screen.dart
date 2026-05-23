import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/view/paymentScreen/payment_screen.dart';

import '../../model/address_model.dart';
import '../../viewmodel/address_viewmodel.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}
class _AddressScreenState extends State<AddressScreen> {

  final _formKey = GlobalKey<FormState>();

  final houseController = TextEditingController();
  final societyController = TextEditingController();
  final floorController = TextEditingController();
  final landmarkController = TextEditingController();
  final localityController = TextEditingController();
  final pinController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<AddressViewmodel>(context, listen: false).fetchStates();
    });
  }

  @override
  void dispose() {
    houseController.dispose();
    societyController.dispose();
    floorController.dispose();
    landmarkController.dispose();
    localityController.dispose();
    pinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {

    final vm = Provider.of<AddressViewmodel>(context);

    return Scaffold(
      appBar: AppBar(title: Text("Address")),

      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),

        child: Form(
          key: _formKey,

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              Text("Enter New Address",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              SizedBox(height: 16),

              Text("Select Address Type"),

              SizedBox(height: 10),

              Row(
                children: ["Home", "Office", "Other"].map((type) {
                  final isSelected = vm.selectedType == type;

                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: ChoiceChip(
                      label: Text(type),
                      selected: isSelected,
                      onSelected: (_) {
                        vm.setType(type);
                      },
                    ),
                  );
                }).toList(),
              ),

              SizedBox(height: 20),

              /// TEXTFIELDS
              ///
              _buildField(houseController, "House/Flat/Apartment No."),
              _buildField(societyController, "Society / Apartment Name"),
              _buildField(floorController, "Floor"),
              _buildField(landmarkController, "Landmark"),
              
              // State Dropdown
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<String>(
                  value: vm.selectedState,
                  hint: const Text("Select State"),
                  items: vm.states.map((state) {
                    return DropdownMenuItem<String>(
                      value: state,
                      child: Text(state),
                    );
                  }).toList(),
                  onChanged: (val) {
                    vm.selectState(val);
                  },
                  validator: (val) => val == null ? "required state" : null,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: "State",
                  ),
                ),
              ),

              // City Dropdown
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: DropdownButtonFormField<String>(
                  value: vm.selectedCity,
                  hint: const Text("Select City"),
                  items: vm.cities.map((city) {
                    return DropdownMenuItem<String>(
                      value: city,
                      child: Text(city),
                    );
                  }).toList(),
                  onChanged: (val) {
                    vm.selectCity(val);
                  },
                  validator: (val) => val == null ? "required city" : null,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    labelText: "City",
                  ),
                ),
              ),

              _buildField(localityController, "Locality"),
              _buildField(pinController, "Pin code"),

              SizedBox(height: 15),

              /// BUTTON
              SizedBox(
                width: double.infinity,
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue, Colors.green], //  gradient
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ElevatedButton(
                    onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        vm.saveAddress(
                          AddressModel(
                            type: vm.selectedType,
                            houseNo: houseController.text,
                            society: societyController.text,
                            floor: floorController.text,
                            landmark: landmarkController.text,
                            city: "${vm.selectedState}, ${vm.selectedCity}",
                            locality: localityController.text,
                            pincode: pinController.text,
                          ),
                        );

                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => PaymentScreen()),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                    ),
                    child: Text(
                      "Confirm Address",
                      style: TextStyle(color: Colors.white,fontWeight: FontWeight.bold,fontSize:15,
                    ),
                  ),
                ),
              )
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(TextEditingController controller, String hint) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: OutlineInputBorder(),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return "required address";
          }
          return null;
        },
      ),
    );
  }
}