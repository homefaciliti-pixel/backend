import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/view/auth/login_screen.dart';
import 'package:userapp/view/auth/otp_screen.dart';
import 'package:userapp/view/booking_map/tracking_screen.dart';
import 'package:userapp/view/home/categories/categories_screen.dart';
import 'package:userapp/view/home/home_screen.dart';
import 'package:userapp/view/mainScreen/main_screen.dart';
import 'package:userapp/view/splash/splash_screen.dart';
import 'package:userapp/viewmodel/address_viewmodel.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import 'package:userapp/viewmodel/booking_flow_viewmodel.dart';
import 'package:userapp/viewmodel/categoryviewmodel.dart';
import 'package:userapp/viewmodel/drawer_viewmodel.dart';
import 'package:userapp/viewmodel/order_viewmodel.dart';
import 'package:userapp/viewmodel/service_viewmodel.dart';
import 'package:userapp/viewmodel/wallet_viewmodel.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) {
            final vm = AuthViewmodel();
            vm.loadUser();
            return vm;
          },
        ),
        ChangeNotifierProvider(create: (_) => ServiceViewModel()),
        ChangeNotifierProvider(create: (_) => CategoryViewModel()),
        ChangeNotifierProvider(create: (_) => DrawerViewmodel()),
        ChangeNotifierProvider(create: (_) => AddressViewmodel()),
        ChangeNotifierProvider(create: (_) => OrderViewmodel()),
        ChangeNotifierProvider(create: (_) => BookingFlowViewModel()),
        ChangeNotifierProvider(create: (_) => WalletViewmodel()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        initialRoute: "/",
        routes: {
          "/": (context) => const SplashScreen(),
          "/login": (context) => const LoginScreen(),
          "/otp": (context) => const OtpScreen(),
          "/home": (context) => const HomeScreen(),
          "/main": (context) => const MainScreen(),
          "/categories": (context) => const CategoriesScreen(),
          "/tracking": (context) => const TrackingScreen(),
        },
      ),
    );
  }
}