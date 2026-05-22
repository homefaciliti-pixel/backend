import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/model/user_model.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/utils/app_icons.dart';
import '../../../viewmodel/auth_viewmodel.dart';
import '../../../viewmodel/location_viewmodel.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  TextEditingController nameController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController emailController = TextEditingController();

  TextEditingController stateCityController = TextEditingController(); //
  TextEditingController localityController = TextEditingController();

  String selectedGender = "Male";
  @override

  //Autofill profile data
  void initState() {
    super.initState();

    final vm = Provider.of<AuthViewmodel>(context, listen: false);

    nameController.text = vm.user.name;
    phoneController.text = vm.user.phone;
    emailController.text = vm.user.email;
    stateCityController.text = vm.user.location;
    localityController.text = vm.user.locality;
    selectedGender = vm.user.gender;
  }

  //  STATE SHEET

  void showStateSheet(BuildContext context) {
    final vm = Provider.of<LocationViewModel>(context, listen: false);

    showModalBottomSheet(
      context: context,
      builder: (_) {
        return ListView(
          children: vm.states.keys.map((state) {
            return ListTile(
              title: Text(state),
              onTap: () {
                vm.selectState(state);
                Navigator.pop(context);
                showCitySheet(context);
              },
            );
          }).toList(),
        );
      },
    );
  }

  //  CITY SHEET
  void showCitySheet(BuildContext context) {
    final vm = Provider.of<LocationViewModel>(context, listen: false);

    showModalBottomSheet(
      context: context,
      builder: (_) {
        return ListView(
          children: vm.states[vm.selectedState!]!.map((city) {
            return ListTile(
              title: Text(city),
              onTap: () {
                vm.selectCity(city);

                stateCityController.text = "$city, ${vm.selectedState}";

                Navigator.pop(context);
              },
            );
          }).toList(),
        );
      },
    );
  }

  // LOCALITY SHEET
  void showLocalitySheet(BuildContext context) {
    final vm = Provider.of<LocationViewModel>(context, listen: false);

    if (vm.selectedCity == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Pehle City select karo")));
      return;
    }

    showModalBottomSheet(
      context: context,
      builder: (_) {
        return ListView(
          children: vm.localities[vm.selectedCity!]!.map((loc) {
            return ListTile(
              title: Text(loc),
              onTap: () {
                vm.selectLocality(loc);
                localityController.text = loc;
                Navigator.pop(context);
              },
            );
          }).toList(),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      appBar: AppBar(title: const Text("Profile",style: TextStyle(fontWeight:FontWeight.bold,fontSize: 30),)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            const SizedBox(height: 50),

            TextField(
              controller: nameController,
              decoration: InputDecoration(
                labelText: "Full Name",
                prefixIcon: Icon(AppIcons.person, color: Colors.black),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: phoneController,
              decoration: InputDecoration(
                labelText: "Phone Number",
                prefixIcon: Icon(AppIcons.phone, color: Colors.black),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: "Email id",
                prefixIcon: Icon(AppIcons.email, color: AppColors.back),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),

            const SizedBox(height: 20),

            //  STATE + CITY
            TextField(
              controller: stateCityController,
              readOnly: true,
              onTap: () => showStateSheet(context),
              decoration: InputDecoration(
                hintText: "State, City",
                prefixIcon: Icon(AppIcons.location),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),

            const SizedBox(height: 20),

            //  LOCALITY
            TextField(
              controller: localityController,
              readOnly: true,
              onTap: () => showLocalitySheet(context),
              decoration: InputDecoration(
                hintText: "Locality",
                prefixIcon: Icon(AppIcons.mylocation),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),
            Row(
              children: [
                Radio(
                  value: "Male",
                  groupValue: selectedGender,
                  onChanged: (value) {
                    setState(() => selectedGender = value!);
                  },
                ),
                Text("Male"),
                Radio(
                  value: "Female",
                  groupValue: selectedGender,
                  onChanged: (value) {
                    setState(() => selectedGender = value!);
                  },
                ),
                Text("Female"),
              ],
            ),

            SizedBox(height: 50),

            ElevatedButton(
              onPressed: () async {
                final updatedUser = UserModel(
                  name: nameController.text,
                  phone: phoneController.text,
                  email: emailController.text,
                  location: stateCityController.text,
                  locality: localityController.text,
                  gender: selectedGender, referralCode: '',
                );

                final authVM = Provider.of<AuthViewmodel>(
                  context,
                  listen: false,
                );

                await authVM.saveUser(updatedUser);

                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(const SnackBar(content: Text("Profile Saved")));
              },

              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.blue,
                foregroundColor: Colors.white,
                minimumSize: Size(200, 50),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),

              child: Text(
                "Save",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
