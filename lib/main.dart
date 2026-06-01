import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/services/banner/banner_auth%20api.dart';
import 'package:userapp/services/category/category_auth_api.dart';
import 'package:userapp/services/checkout_services_auth/checkout_viewmodel.dart';
import 'package:userapp/services/orders/orders_auth.dart';
import 'package:userapp/services/product/all_service_auth_api.dart';
import 'package:userapp/services/product/category_services_auth.dart';
import 'package:userapp/services/product/product_details_auth.dart';
import 'package:userapp/services/product/trending_auth_api.dart';
import 'package:userapp/services/search/search_auth.dart';
import 'package:userapp/view/auth/login_screen.dart';
import 'package:userapp/view/auth/otp_screen.dart';
import 'package:userapp/view/booking_map/tracking_screen.dart';
import 'package:userapp/view/home/categories/categories_screen.dart';
import 'package:userapp/view/home/drawer/about_us.dart';
import 'package:userapp/view/home/drawer/delete_account.dart';
import 'package:userapp/view/home/drawer/enquiry_contact.dart';
import 'package:userapp/view/home/drawer/privacy_policy.dart';
import 'package:userapp/view/home/drawer/refund_and_cancellation.dart';
import 'package:userapp/view/home/drawer/term_and_condition.dart';
import 'package:userapp/view/home/home_screen.dart';
import 'package:userapp/view/mainScreen/main_screen.dart';
import 'package:userapp/view/search/search_screen.dart';
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
        //ChangeNotifierProvider(create: (_) => CategoryViewModel()),
        ChangeNotifierProvider(create: (_) => DrawerViewmodel()),
        ChangeNotifierProvider(create: (_) => AddressViewmodel()),
        ChangeNotifierProvider(create: (_) => OrderViewmodel()),
        ChangeNotifierProvider(create: (_) => BookingFlowViewModel()),
        ChangeNotifierProvider(create: (_) => WalletViewmodel()),
        ///Auth

        ChangeNotifierProvider( create: (_) => BannerViewmodel(), ),
        ChangeNotifierProvider( create: (_) => CategoryViewmodelApi(),),
        ChangeNotifierProvider(create: (_) => TrendingServiceViewmodel(),),
        ChangeNotifierProvider(create: (_) => AllServiceViewmodel(),),
        ChangeNotifierProvider(create: (_)=> CategoryServicesAuth(),),
        ChangeNotifierProvider( create: (_) => ProductDetailViewModel(),),
        ChangeNotifierProvider(create: (_) => AddressViewmodel(),),
        ChangeNotifierProvider(create: (_) => CheckoutViewModel(),),
        ChangeNotifierProvider(create: (_) => SearchProvider(),),
        ChangeNotifierProvider(create: (_) => OrderProvider(),),
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

            "/privacy": (context) =>const PrivacyPolicyPage(),
          "/about": (context) => const AboutUsPage(),
            "/terms": (context) => const TermsPage(),
          "/refund": (context) => const RefundPolicyPage(),
          "/support": (context) => const EnquiryContactPage(),
          "/accountDelete": (context) => const DeleteAccountPage(),
          "/search": (context) => const SearchScreen(),
          // "/refund": (context) => const RefundPolicyPage(),
          // "/refund": (context) => const RefundPolicyPage(),


        },
      ),
    );
  }
}