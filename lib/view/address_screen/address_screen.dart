import 'package:flutter/material.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../model/address_model.dart';
import '../../utils/app_colors.dart';
import '../../view/paymentScreen/payment_screen.dart';
import '../../viewmodel/address_viewmodel.dart';
import '../home/servicesdetail screen/checkout_screen.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});
  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final nameController=  TextEditingController();
  final houseController = TextEditingController();
  final societyController = TextEditingController();
  final floorController = TextEditingController();
  final landmarkController = TextEditingController();
  final phoneNumberController= TextEditingController();
  final cityController = TextEditingController();
  final localityController = TextEditingController();
  final pinController = TextEditingController();
  GoogleMapController? mapController;

  LatLng currentPosition = const LatLng(26.9124, 75.7873);

  Marker? selectedMarker;

  String currentAddress = "";

  @override
  void initState() {
    super.initState();
    getCurrentLocation();
  }

  Future<void> getCurrentLocation() async {

    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled =
    await Geolocator.isLocationServiceEnabled();

    if (!serviceEnabled) {
      return;
    }

    permission =
    await Geolocator.checkPermission();

    if (permission ==
        LocationPermission.denied) {

      permission =
      await Geolocator.requestPermission();
    }

    if (permission ==
        LocationPermission.deniedForever) {

      return;
    }

    Position position =
    await Geolocator.getCurrentPosition(
      desiredAccuracy:
      LocationAccuracy.high,
    );

    LatLng latLng = LatLng(
      position.latitude,
      position.longitude,
    );

    setState(() {

      currentPosition = latLng;

      selectedMarker = Marker(

        markerId:
        const MarkerId("selected"),

        position: latLng,

        draggable: true,

        icon:
        BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueViolet,
        ),

        onDragEnd: (value) {
          updateLocation(value);
        },
      );
    });

    moveCamera(latLng);

    updateLocation(latLng);
  }

  Future<void> moveCamera(
      LatLng latLng,
      ) async {

    mapController?.animateCamera(

      CameraUpdate.newCameraPosition(

        CameraPosition(
          target: latLng,
          zoom: 18,
        ),
      ),
    );
  }

  Future<void> updateLocation(
      LatLng latLng,
      ) async {

    setState(() {
      currentPosition = latLng;
    });

    List<Placemark> placemarks =
    await placemarkFromCoordinates(
      latLng.latitude,
      latLng.longitude,
    );

    Placemark place = placemarks.first;

    setState(() {

      currentAddress =
      "${place.street}, "
          "${place.locality}, "
          "${place.administrativeArea}, "
          "${place.postalCode}";

      cityController.text =
      "${place.administrativeArea}, "
          "${place.locality}";

      localityController.text =
          place.subLocality ?? "";

      pinController.text =
          place.postalCode ?? "";
    });
  }

  @override
  Widget build(BuildContext context) {
    final vm =Provider.of<AddressViewmodel>(context);
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [

          /// MAP
          SizedBox(

            height: MediaQuery.of(context)
                .size
                .height *
                0.52,

            child:
            GoogleMap(

              mapType: MapType.normal,

              initialCameraPosition: CameraPosition(
                target: currentPosition,
                zoom: 17,
              ),

              myLocationEnabled: true,

              myLocationButtonEnabled: false,

              zoomControlsEnabled: true,

              zoomGesturesEnabled: true,

              scrollGesturesEnabled: true,

              rotateGesturesEnabled: true,

              tiltGesturesEnabled: true,

              compassEnabled: true,

              trafficEnabled: false,

              buildingsEnabled: true,

              indoorViewEnabled: true,

              mapToolbarEnabled: true,

              markers: {
                Marker(

                  markerId: const MarkerId("selected"),

                  position: currentPosition,

                  draggable: true,

                  icon: BitmapDescriptor.defaultMarker,

                  infoWindow: const InfoWindow(
                    title: "Selected Location",
                  ),

                  onDragEnd: (LatLng value) {

                    setState(() {
                      currentPosition = value;
                    });

                    updateLocation(value);
                  },
                ),
              },

              onMapCreated: (GoogleMapController controller) {

                mapController = controller;

                controller.animateCamera(
                  CameraUpdate.newCameraPosition(
                    CameraPosition(
                      target: currentPosition,
                      zoom: 17,
                    ),
                  ),
                );
              },

              onTap: (LatLng latLng) {

                setState(() {
                  currentPosition = latLng;
                });

                updateLocation(latLng);

                mapController?.animateCamera(
                  CameraUpdate.newLatLng(latLng),
                );
              },
            )

          ),

          /// BACK BUTTON
          Positioned(

            top: 45,
            left: 15,

            child: CircleAvatar(

              backgroundColor: Colors.white,

              child: IconButton(

                icon: const Icon(
                  Icons.arrow_back,
                  color: Colors.black,
                ),

                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ),
          ),

          /// CLOSE BUTTON
          Positioned(

            top: 45,
            right: 15,

            child: CircleAvatar(

              backgroundColor: Colors.white,

              child: IconButton(

                icon: const Icon(
                  Icons.close,
                  color: Colors.black,
                ),

                onPressed: () {
                  Navigator.pop(context);
                },
              ),
            ),
          ),

          /// CURRENT LOCATION BUTTON
          Positioned(

            top: MediaQuery.of(context)
                .size
                .height *
                0.42,

            right: 15,

            child: FloatingActionButton(

              mini: true,

              backgroundColor: Colors.white,

              onPressed: () {
                getCurrentLocation();
              },

              child: const Icon(
                Icons.my_location,
                color: Colors.black,
              ),
            ),
          ),

          /// MESSAGE
          Positioned(

            top: MediaQuery.of(context)
                .size
                .height *
                0.28,

            left: 40,
            right: 40,

            child: Container(

              padding:
              const EdgeInsets.symmetric(
                horizontal: 15,
                vertical: 10,
              ),

              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius:
                BorderRadius.circular(12),
              ),

              child: const Text(
                "Place the pin accurately on map",

                textAlign: TextAlign.center,

                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ),
          ),

          /// BOTTOM SHEET
          DraggableScrollableSheet(

            initialChildSize: 0.48,

            minChildSize: 0.48,

            maxChildSize: 0.90,

            builder: (context, scrollController) {

              return Container(

                padding: const EdgeInsets.all(16),

                decoration: const BoxDecoration(

                  color: Colors.white,

                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(25),
                    topRight: Radius.circular(25),
                  ),
                ),

                child: SingleChildScrollView(

                  controller: scrollController,

                  child: Form(

                    key: _formKey,

                    child: Column(

                      crossAxisAlignment:
                      CrossAxisAlignment.start,

                      children: [

                        /// DRAG HANDLE
                        Center(
                          child: Container(
                            width: 50,
                            height: 5,
                            decoration: BoxDecoration(
                              color: Colors.grey.shade400,
                              borderRadius:
                              BorderRadius.circular(20),
                            ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        /// ADDRESS TITLE
                        const Text(

                          "Selected Address",

                          style: TextStyle(
                            fontSize: 20,
                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        /// ADDRESS
                        Text(

                          currentAddress.isEmpty
                              ? "Fetching location..."
                              : currentAddress,

                          style: const TextStyle(
                            fontSize: 15,
                            color: Colors.black87,
                          ),
                        ),

                        const SizedBox(height: 20),

                        /// ADDRESS TYPE
                        Row(

                          children:
                          ["Home", "Office", "Other"]
                              .map((type) {

                            final isSelected =
                                vm.selectedType ==
                                    type;

                            return Padding(

                              padding:
                              const EdgeInsets.only(
                                  right: 10),

                              child: ChoiceChip(

                                label: Text(type),

                                selected: isSelected,

                                selectedColor:
                                AppColors
                                    .primaryButton,

                                labelStyle: TextStyle(
                                  color: isSelected
                                      ? Colors.white
                                      : Colors.black,
                                ),

                                onSelected: (_) {
                                  vm.setType(type);
                                },
                              ),
                            );
                          }).toList(),
                        ),

                        const SizedBox(height: 20),

                        _buildField(
                          nameController,
                          "Name",
                        ),
                        _buildField(
                          houseController,
                          "House/Flat Number",
                        ),

                        _buildField(
                          societyController,
                          "Society / Apartment",
                        ),

                        _buildField(
                          floorController,
                          "Floor",
                        ),

                        _buildField(
                          landmarkController,
                          "Landmark",
                        ),
                        const SizedBox(height: 20),
                        _buildField(
                          phoneNumberController,
                          "Alternate Phone Number",
                        ),
                        _buildField(
                          cityController,
                          "State, City",
                        ),

                        _buildField(
                          localityController,
                          "Locality",
                        ),

                        _buildField(
                          pinController,
                          "Pin Code",
                        ),

                        const SizedBox(height: 20),

                        /// SAVE BUTTON
                        SizedBox(

                          width: double.infinity,
                          height: 55,

                          child: Container(

                            decoration: BoxDecoration(

                              gradient: LinearGradient(

                                colors: [
                                  AppColors
                                      .primaryButton,

                                  AppColors
                                      .secondaryButton,
                                ],
                              ),

                              borderRadius:
                              BorderRadius.circular(
                                  30),
                            ),

                            child: ElevatedButton(
                              onPressed: () async {

                                final prefs =
                                await SharedPreferences.getInstance();

                                String? token =
                                prefs.getString("token");

                                if (token == null || token.isEmpty) {

                                  ScaffoldMessenger.of(context).showSnackBar(

                                    const SnackBar(
                                      content: Text("Token not found"),
                                    ),
                                  );

                                  return;
                                }

                                if (_formKey.currentState!.validate()) {

                                  final body = {

                                    "type": vm.selectedType,
                                    "name": nameController.text.trim(),
                                    "alternateNumber":phoneNumberController.text.trim(),

                                    "houseNo": houseController.text.trim(),

                                    "society": societyController.text.trim(),

                                    "floor": floorController.text.trim(),

                                    "landmark": landmarkController.text.trim(),

                                    "city": cityController.text.trim(),

                                    "locality": localityController.text.trim(),

                                    "pincode": pinController.text.trim(),

                                    "latitude": currentPosition.latitude,

                                    "longitude": currentPosition.longitude,
                                  };

                                  final success =
                                  await vm.saveAddressApi(

                                    token: token,

                                    body: body,
                                  );

                                  if (!mounted) return;

                                  if (success) {

                                    ScaffoldMessenger.of(context).showSnackBar(

                                      const SnackBar(
                                        content: Text("Address Saved"),
                                      ),
                                    );

                                    Navigator.push(

                                      context,

                                      MaterialPageRoute(
                                        builder: (_) => CheckoutScreen(),
                                      ),
                                    );

                                  } else {

                                    ScaffoldMessenger.of(context).showSnackBar(

                                      const SnackBar(
                                        content: Text("Failed to save address"),
                                      ),
                                    );
                                  }
                                }
                              },
                              // onPressed: () {
                              //
                              //   if (_formKey
                              //       .currentState!
                              //       .validate()) {
                              //
                              //     vm.saveAddress(
                              //
                              //       AddressModel(
                              //
                              //         type:
                              //         vm.selectedType,
                              //
                              //         houseNo:
                              //         houseController
                              //             .text,
                              //
                              //         society:
                              //         societyController
                              //             .text,
                              //
                              //         floor:
                              //         floorController
                              //             .text,
                              //
                              //         landmark:
                              //         landmarkController
                              //             .text,
                              //
                              //         city:
                              //         cityController
                              //             .text,
                              //
                              //         locality:
                              //         localityController
                              //             .text,
                              //
                              //         pincode:
                              //         pinController
                              //             .text,
                              //       ),
                              //     );
                              //
                              //     Navigator.push(
                              //
                              //       context,
                              //
                              //       MaterialPageRoute(
                              //         builder: (_) =>
                              //         CheckoutScreen(),
                              //           //  PaymentScreen(),
                              //       ),
                              //     );
                              //   }
                              // },

                              style:
                              ElevatedButton
                                  .styleFrom(

                                backgroundColor:
                                Colors
                                    .transparent,

                                shadowColor:
                                Colors
                                    .transparent,
                              ),
                               child: vm.loading

                            ? const SizedBox(

                            height: 22,
                              width: 22,

                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )

                                : const Text(

                            "Check Out",

                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildField(
      TextEditingController controller,
      String hint,
      ) {
    return Padding(
      padding:
      const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          contentPadding:
          const EdgeInsets.symmetric(
            horizontal: 15,
            vertical: 16,
          ),

          border: OutlineInputBorder(

            borderRadius:
            BorderRadius.circular(15),
          ),
        ),

        validator: (value) {

          if (value == null ||
              value.isEmpty) {

            return "Required";
          }

          return null;
        },
      ),
    );
  }
}