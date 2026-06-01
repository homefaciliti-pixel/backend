// import 'package:flutter/material.dart';
// import 'package:userapp/utils/app_colors.dart';
// import 'package:userapp/utils/app_icons.dart';
// import 'package:userapp/view/home/categories/categories_screen.dart';
// import 'package:userapp/view/home/home_screen.dart';
// import 'package:userapp/view/home/order/order_history_screen.dart';
// import 'package:userapp/view/home/profile/profile_screen.dart';
//
// class MainScreen extends StatefulWidget {
//   const MainScreen({super.key});
//
//   @override
//   State<MainScreen> createState() => _MainScreenState();
// }
//
// class _MainScreenState extends State<MainScreen> {
//
//   int _currentIndex = 0;
//
//   final List screns=[
//     HomeScreen(),
//     CategoriesScreen(),
//     OrderHistoryScreen(),
//     ProfileScreen(),
//   ];
//
//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//
//       body: screns[_currentIndex],
// backgroundColor: Colors.white,
//       bottomNavigationBar: BottomNavigationBar(
//
//         currentIndex: _currentIndex,   //  IMPORTANT
//
//         onTap: (index) {
//           setState(() {
//             _currentIndex = index;
//           });
//         },
//
//         type: BottomNavigationBarType.fixed,  //  IMPORTANT
//
//         selectedItemColor: AppColors.secondaryButton,
//         unselectedItemColor: AppColors.back,
//
//         items: [
//
//           BottomNavigationBarItem(
//             icon: Icon(AppIcons.home),
//             label: "Home",
//           ),
//           BottomNavigationBarItem(
//             icon: Icon(AppIcons.category),
//             label: "Category",
//           ),
//
//           BottomNavigationBarItem(
//             icon: Icon(AppIcons.order),
//             label: "Order",
//           ),
//
//
//           BottomNavigationBarItem(
//             icon: Icon(AppIcons.profile),
//             label: "Profile",
//           ),
//
//         ],
//       ),
//     );
//   }
// }
import 'package:flutter/material.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/utils/app_icons.dart';
import 'package:userapp/view/home/categories/categories_screen.dart';
import 'package:userapp/view/home/home_screen.dart';
import 'package:userapp/view/home/order/order_history_screen.dart';
import 'package:userapp/view/home/profile/profile_screen.dart';

import '../home/order/order_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() =>
      _MainScreenState();
}

class _MainScreenState
    extends State<MainScreen> {

  int _currentIndex = 0;

  final List<Widget> screens = [

    const HomeScreen(),

    const CategoriesScreen(),
    const OrdersListPage(),
    //const OrderHistoryScreen(),

    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      extendBody: true,

      backgroundColor: Colors.white,

      body: AnimatedSwitcher(

        duration:
        const Duration(milliseconds: 300),

        child: screens[_currentIndex],
      ),

      /// BOTTOM NAVIGATION
      bottomNavigationBar: Container(

        margin: const EdgeInsets.only(
          left: 16,
          right: 16,
          bottom: 16,
        ),

        decoration: BoxDecoration(

          color: Colors.white,

          borderRadius:
          BorderRadius.circular(30),

          boxShadow: [

            BoxShadow(

              color:
              Colors.black.withOpacity(0.08),

              blurRadius: 20,

              offset: const Offset(0, 8),
            ),
          ],
        ),

        child: ClipRRect(

          borderRadius:
          BorderRadius.circular(30),

          child: BottomNavigationBar(

            currentIndex: _currentIndex,

            onTap: (index) {

              setState(() {
                _currentIndex = index;
              });
            },

            type:
            BottomNavigationBarType.fixed,

            elevation: 0,

            backgroundColor: Colors.white,

            selectedItemColor:
            AppColors.primaryButton,

            unselectedItemColor:
            Colors.grey.shade500,

            selectedLabelStyle:
            const TextStyle(

              fontSize: 12,

              fontWeight:
              FontWeight.bold,
            ),

            unselectedLabelStyle:
            const TextStyle(
              fontSize: 11,
            ),

            items: [

              /// HOME
              BottomNavigationBarItem(

                icon: buildNavIcon(

                  icon: AppIcons.home,

                  index: 0,
                ),

                label: "Home",
              ),

              /// CATEGORY
              BottomNavigationBarItem(

                icon: buildNavIcon(

                  icon: AppIcons.category,

                  index: 1,
                ),

                label: "Categories",
              ),

              /// ORDER
              BottomNavigationBarItem(

                icon: buildNavIcon(

                  icon: AppIcons.order,

                  index: 2,
                ),

                label: "Orders",
              ),

              /// PROFILE
              BottomNavigationBarItem(

                icon: buildNavIcon(

                  icon: AppIcons.profile,

                  index: 3,
                ),

                label: "Profile",
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// CUSTOM NAV ICON
  Widget buildNavIcon({

    required IconData icon,
    required int index,
  }) {

    bool isSelected =
        _currentIndex == index;

    return AnimatedContainer(

      duration:
      const Duration(milliseconds: 250),

      padding: const EdgeInsets.all(10),

      decoration: BoxDecoration(

        gradient: isSelected

            ? LinearGradient(

          colors: [

            AppColors.primaryButton,

            AppColors.secondaryButton,
          ],
        )

            : null,

        color:
        isSelected
            ? null
            : Colors.transparent,

        borderRadius:
        BorderRadius.circular(14),
      ),

      child: Icon(

        icon,

        size: 24,

        color:
        isSelected
            ? Colors.white
            : Colors.grey.shade500,
      ),
    );
  }
}