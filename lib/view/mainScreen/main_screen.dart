import 'package:flutter/material.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/utils/app_icons.dart';
import 'package:userapp/view/home/categories/categories_screen.dart';
import 'package:userapp/view/home/home_screen.dart';
import 'package:userapp/view/home/order/order_history_screen.dart';
import 'package:userapp/view/home/profile/profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {

  int _currentIndex = 0;

  final List screns=[
    HomeScreen(),
    OrderHistoryScreen(),
    CategoriesScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(

      body: screns[_currentIndex],

      bottomNavigationBar: BottomNavigationBar(

        currentIndex: _currentIndex,   //  IMPORTANT

        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },

        type: BottomNavigationBarType.fixed,  //  IMPORTANT

        selectedItemColor: AppColors.primaryBlue,
        unselectedItemColor: AppColors.back,

        items: [

          BottomNavigationBarItem(
            icon: Icon(AppIcons.home),
            label: "Home",
          ),

          BottomNavigationBarItem(
            icon: Icon(AppIcons.order),
            label: "Order",
          ),

          BottomNavigationBarItem(
            icon: Icon(AppIcons.category),
            label: "Category",
          ),

          BottomNavigationBarItem(
            icon: Icon(AppIcons.profile),
            label: "Profile",
          ),

        ],
      ),
    );
  }
}