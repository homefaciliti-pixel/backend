import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

import '../../model/booking_status.dart';
import '../../viewmodel/booking_flow_viewmodel.dart';

class TrackingScreen extends StatefulWidget {
  const TrackingScreen({super.key});

  @override
  State<TrackingScreen> createState() =>
      _TrackingScreenState();
}

class _TrackingScreenState
    extends State<TrackingScreen> {

  /// GOOGLE MAP CONTROLLER
  GoogleMapController? mapController;

  /// USER CURRENT LOCATION
  LatLng currentLocation =
  const LatLng(26.9124, 75.7873);

  /// DEMO PARTNER LOCATION
  LatLng partnerLocation =
  const LatLng(26.9220, 75.8000);

  /// MAP MARKERS
  Set<Marker> markers = {};

  @override
  void initState() {
    super.initState();

    /// GET USER CURRENT LOCATION
    getCurrentLocation();

    /// ADD DEMO MARKERS
    updateMarkers();
  }

  /// =========================
  /// GET CURRENT LOCATION
  /// =========================
  Future<void> getCurrentLocation() async {

    try {

      /// LOCATION PERMISSION
      LocationPermission permission =
      await Geolocator.requestPermission();

      if (permission ==
          LocationPermission.denied) {
        return;
      }

      /// GET CURRENT POSITION
      Position position =
      await Geolocator.getCurrentPosition(
        desiredAccuracy:
        LocationAccuracy.high,
      );

      setState(() {

        currentLocation = LatLng(
          position.latitude,
          position.longitude,
        );

        updateMarkers();
      });

      /// MOVE CAMERA TO USER LOCATION
      mapController?.animateCamera(
        CameraUpdate.newLatLngZoom(
          currentLocation,
          15,
        ),
      );

    } catch (e) {

      debugPrint(
        "Location Error: $e",
      );
    }
  }

  /// =========================
  /// UPDATE MAP MARKERS
  /// =========================
  void updateMarkers() {

    markers = {

      /// USER MARKER
      Marker(
        markerId:
        const MarkerId("user"),

        position: currentLocation,

        infoWindow:
        const InfoWindow(
          title: "Your Location",
        ),
      ),

      /// PARTNER MARKER
      Marker(
        markerId:
        const MarkerId("partner"),

        position: partnerLocation,

        infoWindow:
        const InfoWindow(
          title: "Partner",
        ),

        icon:
        BitmapDescriptor.defaultMarkerWithHue(
          BitmapDescriptor.hueBlue,
        ),
      ),
    };
  }

  @override
  Widget build(BuildContext context) {

    /// BOOKING FLOW VIEWMODEL
    final vm =
    Provider.of<BookingFlowViewModel>(
      context,
    );

    return Scaffold(

      backgroundColor:
      Colors.grey.shade100,

      appBar: AppBar(
        title: const Text(
          "Track Order",
        ),
      ),

      body: Stack(
        children: [

          /// =========================
          /// REAL GOOGLE MAP
          /// =========================
          GoogleMap(

            initialCameraPosition:
            CameraPosition(
              target: currentLocation,
              zoom: 15,
            ),

            /// MAP MARKERS
            markers: markers,

            /// USER BLUE DOT
            myLocationEnabled: true,

            /// LOCATION BUTTON
            myLocationButtonEnabled: true,

            /// REMOVE DEFAULT ZOOM BUTTON
            zoomControlsEnabled: false,

            onMapCreated: (controller) {

              /// SAVE MAP CONTROLLER
              mapController = controller;
            },
          ),

          /// =========================
          /// BOTTOM SHEET
          /// =========================
          Align(
            alignment:
            Alignment.bottomCenter,

            child: Container(

              height:
              MediaQuery.of(context)
                  .size
                  .height *
                  0.58,

              width: double.infinity,

              padding:
              const EdgeInsets.all(16),

              decoration:
              const BoxDecoration(

                color: Colors.white,

                borderRadius:
                BorderRadius.only(
                  topLeft:
                  Radius.circular(24),

                  topRight:
                  Radius.circular(24),
                ),
              ),

              child:
              SingleChildScrollView(

                child: Column(

                  crossAxisAlignment:
                  CrossAxisAlignment
                      .start,

                  mainAxisSize:
                  MainAxisSize.min,

                  children: [

                    /// TOP HANDLE
                    Center(
                      child: Container(
                        height: 5,
                        width: 60,

                        decoration:
                        BoxDecoration(
                          color: Colors
                              .grey
                              .shade300,

                          borderRadius:
                          BorderRadius
                              .circular(
                            20,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(
                      height: 18,
                    ),

                    /// =========================
                    /// PARTNER CARD
                    /// =========================
                    Container(

                      padding:
                      const EdgeInsets
                          .all(16),

                      decoration:
                      BoxDecoration(

                        color:
                        Colors.white,

                        borderRadius:
                        BorderRadius
                            .circular(
                          16,
                        ),

                        boxShadow: [
                          BoxShadow(
                            color: Colors
                                .black12,

                            blurRadius: 5,
                          ),
                        ],
                      ),

                      child: Row(
                        children: [

                          /// PARTNER IMAGE
                          CircleAvatar(
                            radius: 30,

                            backgroundColor:
                            Colors.blue
                                .shade100,

                            child:
                            const Icon(
                              Icons.person,
                              size: 35,
                            ),
                          ),

                          const SizedBox(
                            width: 16,
                          ),

                          /// PARTNER INFO
                          Expanded(
                            child: Column(

                              crossAxisAlignment:
                              CrossAxisAlignment
                                  .start,

                              children: [

                                Text(
                                  vm.partnerName ??
                                      "Partner Assigned",

                                  style:
                                  const TextStyle(
                                    fontSize:
                                    18,

                                    fontWeight:
                                    FontWeight
                                        .bold,
                                  ),
                                ),

                                const SizedBox(
                                  height: 5,
                                ),

                                Text(
                                  vm.partnerDistance ??
                                      "Nearby Partner",

                                  style:
                                  TextStyle(
                                    color: Colors
                                        .grey
                                        .shade700,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          /// CALL BUTTON
                          Container(

                            padding:
                            const EdgeInsets
                                .all(10),

                            decoration:
                            BoxDecoration(

                              color: Colors
                                  .green
                                  .shade50,

                              shape:
                              BoxShape
                                  .circle,
                            ),

                            child:
                            const Icon(
                              Icons.call,
                              color:
                              Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(
                      height: 22,
                    ),

                    /// ORDER STATUS TITLE
                    const Text(
                      "Order Status",

                      style: TextStyle(
                        fontSize: 18,

                        fontWeight:
                        FontWeight.bold,
                      ),
                    ),

                    const SizedBox(
                      height: 16,
                    ),

                    /// STATUS STEPS
                    buildStatusTile(
                      title:
                      "Searching Partner",

                      isDone:
                      vm.status.index >=
                          BookingStatus
                              .searching
                              .index,
                    ),

                    buildStatusTile(
                      title:
                      "Partner Assigned",

                      isDone:
                      vm.status.index >=
                          BookingStatus
                              .assigned
                              .index,
                    ),

                    buildStatusTile(
                      title:
                      "Partner Accepted",

                      isDone:
                      vm.status.index >=
                          BookingStatus
                              .accepted
                              .index,
                    ),

                    buildStatusTile(
                      title:
                      "On The Way",

                      isDone:
                      vm.status.index >=
                          BookingStatus
                              .onTheWay
                              .index,
                    ),

                    buildStatusTile(
                      title:
                      "Service Completed",

                      isDone:
                      vm.status.index >=
                          BookingStatus
                              .completed
                              .index,
                    ),

                    const SizedBox(
                      height: 10,
                    ),

                    /// ACCEPT BUTTON
                    SizedBox(

                      width:
                      double.infinity,

                      height: 48,

                      child:
                      ElevatedButton(

                        onPressed: () {

                          vm.acceptPartner();
                        },

                        child: const Text(
                          "Partner Accepted",
                        ),
                      ),
                    ),

                    const SizedBox(
                      height: 12,
                    ),

                    /// START JOURNEY
                    SizedBox(

                      width:
                      double.infinity,

                      height: 48,

                      child:
                      ElevatedButton(

                        onPressed: () {

                          vm.startOnTheWay();
                        },

                        child: const Text(
                          "Start Journey",
                        ),
                      ),
                    ),

                    const SizedBox(
                      height: 12,
                    ),

                    /// COMPLETE SERVICE
                    SizedBox(

                      width:
                      double.infinity,

                      height: 48,

                      child:
                      ElevatedButton(

                        onPressed: () {

                          vm.completeBooking();
                        },

                        child: const Text(
                          "Complete Service",
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// =========================
  /// STATUS TILE
  /// =========================
  Widget buildStatusTile({
    required String title,
    required bool isDone,
  }) {

    return Padding(

      padding:
      const EdgeInsets.only(
        bottom: 14,
      ),

      child: Row(
        children: [

          /// STATUS ICON
          CircleAvatar(
            radius: 12,

            backgroundColor:
            isDone
                ? Colors.green
                : Colors.grey,

            child: const Icon(
              Icons.check,
              color: Colors.white,
              size: 14,
            ),
          ),

          const SizedBox(
            width: 12,
          ),

          /// STATUS TEXT
          Text(
            title,

            style: TextStyle(
              fontSize: 16,

              color:
              isDone
                  ? Colors.black
                  : Colors.grey,
            ),
          ),
        ],
      ),
    );
  }
}