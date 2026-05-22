import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    TextEditingController phoneController = TextEditingController();
    return Scaffold(
      appBar: AppBar(
        title: Text("Login"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            SizedBox(height: 40,),
            Text('Welcome',
            style: TextStyle(fontSize: 20),
            ),
            SizedBox(height: 20,),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                border: OutlineInputBorder(),
                hintText: "Enter PhoneNumber"
              ),
            ),
            SizedBox(height: 20,),
            ElevatedButton(onPressed:  ()async{
              final authVM = Provider.of<AuthViewmodel>(context, listen:false);

              await authVM.login();

              Navigator.pushNamed(context, "/otp");
            }, child:Text("Send OTP",)),
          ],
        ),
      ),
    );
  }
}
