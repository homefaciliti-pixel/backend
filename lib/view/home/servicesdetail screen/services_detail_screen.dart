import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/view/address_screen/address_screen.dart';
import '../../../viewmodel/service_viewmodel.dart';

class ServiceDetailScreen extends StatelessWidget {
  const ServiceDetailScreen({super.key});


  void showBookingBottomSheet(BuildContext context) {
    final vm = Provider.of<ServiceViewModel>(context, listen: false);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 16,
                right: 16,
                top: 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  /// TITLE
                  ///
                  Text("Select Date",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),

                  SizedBox(height: 10),

                  /// DATE PICKER BUTTON
                  GestureDetector(
                    onTap: () async {
                      final pickedDate = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime.now(),
                        lastDate: DateTime(2030),
                      );

                      if (pickedDate != null) {
                        vm.setDtae(pickedDate);
                        setState(() {});
                      }
                    },
                    child: Container(
                      padding: EdgeInsets.all(12),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        vm.selectedDate == null
                            ? "Choose Date"
                            : vm.selectedDate.toString().split(" ")[0],
                      ),
                    ),
                  ),

                  SizedBox(height: 20),

                  /// SLOT TITLE
                  Text("Select Slot",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),

                  SizedBox(height: 10),

                  /// SLOTS
                  Wrap(
                    spacing: 10,
                    children: [
                      "9 AM - 11 AM",
                      "11 AM - 1 PM",
                      "2 PM - 4 PM",
                      "4 PM - 6 PM",
                    ].map((slot) {
                      final isSelected = vm.selectedSlot == slot;

                      return ChoiceChip(
                        label: Text(slot),
                        selected: isSelected,
                        onSelected: (_) {
                          vm.setSlot(slot);
                          setState(() {});
                        },
                      );
                    }).toList(),
                  ),

                  SizedBox(height: 20),

                  /// CONFIRM BUTTON

                  SizedBox(

                    width: double.infinity,
                    child :Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors:
                        [Colors.blue,Colors.green

                        ]),
                        borderRadius: BorderRadiusGeometry.circular(12)

                  ),
                    child: ElevatedButton(
                      onPressed: () {

                        if (vm.selectedDate == null || vm.selectedSlot == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text("Select date & slot")),
                          );
                          return;
                        }

                        Navigator.pop(context);

                        ///  NEXT STEP (address screen)


                        Navigator.pushReplacement(context,MaterialPageRoute(builder: (_)=>AddressScreen()));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                      ),
                      child: Text("Confirm",style: TextStyle(color:Colors.white,fontWeight: FontWeight.bold),),
                    ),
                  ),
                  ),
                  SizedBox(height: 10),
                ],


              ),
            );
          },
        );
      },
    );
  }
  

  

  @override
  Widget build(BuildContext context) {
    

    final vm = Provider.of<ServiceViewModel>(context);
    final service = vm.selectedService;

    if (service == null) {
      return Scaffold(
        body: Center(child: Text("No Service Found")),
      );
    }

    return Scaffold(

      appBar: AppBar(
        title: Text(service.title),
      ),

      body: Stack(
        children: [

          /// SCROLL
          SingleChildScrollView(
            padding: EdgeInsets.only(bottom: 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                Container(
                  height: 220,
                  width: double.infinity,
                  color: Colors.grey[300],
                ),

                SizedBox(height: 16),

                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    service.title,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ),

                SizedBox(height: 8),

                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    "₹ ${service.price}.00",
                    style: TextStyle(fontSize: 18, color: Colors.green),
                  ),
                ),

                SizedBox(height: 16),
                Divider(),
                SizedBox(height: 12,),

                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Text("Description",style: TextStyle(fontSize: 18,fontWeight: FontWeight.bold),),
                ),

                SizedBox(height:12),

                Padding(
                  padding: const EdgeInsets.all(15),
                  child: Text(service.description,
                  style: TextStyle(fontSize: 14,color: Colors.black),
                  ),
                ),




                SizedBox(height: 500),
              ],
            ),
          ),


                             ///  FIXED BUTTON
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Container(

              padding: EdgeInsets.all(16),
              color: Colors.white,
              child:Container(decoration: BoxDecoration(
                gradient: LinearGradient(colors:[Colors.blue,Colors.green],
                ),
                borderRadius: BorderRadius.circular(15)

              ),

              child: ElevatedButton(
                onPressed: () {

                  showBookingBottomSheet(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadiusGeometry.circular(12),
                  )
                ),


                child: Text("Book Now"),
              ),
            ),
          ),
          )
        ],
      ),
    );
  }
}