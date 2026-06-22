import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/view/home/servicesdetail%20screen/services_detail_screen.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'package:userapp/view/wallet%20screen%20/wallet_screen.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import 'package:userapp/viewmodel/drawer_viewmodel.dart';
import 'package:userapp/widgets/category_card.dart';
import '../../services/banner/banner_auth api.dart';
import '../../services/category/category_auth_api.dart';
import '../../services/product/all_service_auth_api.dart';
import '../../services/product/trending_auth_api.dart';
import '../../utils/app_icons.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../Refer/refer_screen.dart';
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}
class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<BannerViewmodel>(
        context,
        listen: false,
      ).fetchBanners();
    });
    Future.microtask(() {
      Provider.of<CategoryViewmodelApi>(
        context,
        listen: false,
      ).fetchCategories();
    });
    Future.microtask(() {

      Provider.of<TrendingServiceViewmodel>(
        context,
        listen: false,
      ).fetchTrendingServices();

    });
    Future.microtask(() {

      Provider.of<AllServiceViewmodel>(
        context,
        listen: false,
      ).fetchTrendingServices();
    });
  }
  @override
  Widget build(BuildContext context) {
    final serviceVM = Provider.of<ServiceViewModel>(context);
    final authVm = Provider.of<AuthViewmodel>(context);
    return
      Scaffold(
        backgroundColor: Colors.white,
        drawer: Consumer<DrawerViewmodel>(
          builder: (context, vm, child) {

            /// SAFE USER DATA
            final userName = authVm.user.name.trim();
            final userEmail = authVm.user.email.trim();

            final firstLetter = userName.isNotEmpty
                ? userName[0].toUpperCase()
                : "?";

            return Drawer(
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.horizontal(
                  right: Radius.circular(25),
                ),
              ),

              child: Column(
                children: [

                  /// ================= HEADER =================
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.only(
                      top: 60,
                      left: 20,
                      right: 20,
                      bottom: 25,
                    ),

                    decoration:  BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primaryButton,
                          AppColors.secondaryButton,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),

                      borderRadius: BorderRadius.only(
                        bottomRight: Radius.circular(30),
                      ),
                    ),

                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        /// PROFILE IMAGE
                        CircleAvatar(
                          radius: 35,
                          backgroundColor: Colors.white,

                          child: Text(
                            firstLetter,

                            style:  TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color:    AppColors.primaryButton,
                            ),
                          ),
                        ),

                        const SizedBox(height: 15),

                        /// USER NAME
                        Text(
                          userName.isNotEmpty
                              ? userName
                              : "Guest User",

                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),

                        const SizedBox(height: 5),

                        /// USER EMAIL
                        Text(
                          userEmail.isNotEmpty
                              ? userEmail
                              : "Contact Number",

                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 10),

                  /// ================= MENU LIST =================
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 10,
                      ),

                      itemCount: vm.items.length,

                      itemBuilder: (context, index) {

                        /// SAFE INDEX CHECK
                        if (index >= vm.items.length) {
                          return const SizedBox();
                        }

                        final item = vm.items[index];

                        final isLogout =
                            item.route == "/logout";

                        return Container(
                          margin: const EdgeInsets.only(
                            bottom: 8,
                          ),

                          decoration: BoxDecoration(
                            borderRadius:
                            BorderRadius.circular(15),

                            color: Colors.grey.shade100,
                          ),

                          child: ListTile(
                            contentPadding:
                            const EdgeInsets.symmetric(
                              horizontal: 15,
                              vertical: 5,
                            ),

                            leading: Icon(
                              item.icon,

                              color: isLogout
                                  ? Colors.red
                                  :    AppColors.primaryButton,
                            ),

                            title: Text(
                              item.title,

                              style: TextStyle(
                                fontWeight:
                                FontWeight.w500,
                                fontSize: 16,

                                color: isLogout
                                    ? Colors.red
                                    : Colors.black87,
                              ),
                            ),

                            trailing: const Icon(
                              Icons.arrow_forward_ios,
                              size: 16,
                            ),

                            shape: RoundedRectangleBorder(
                              borderRadius:
                              BorderRadius.circular(15),
                            ),

                            onTap: () async {

                              /// CLOSE DRAWER
                              Navigator.pop(context);

                              /// ================= LOGOUT =================
                              if (isLogout) {

                                showDialog(
                                  context: context,

                                  builder: (context) {

                                    return AlertDialog(
                                      shape:
                                      RoundedRectangleBorder(
                                        borderRadius:
                                        BorderRadius.circular(20),
                                      ),

                                      title: const Text(
                                        "Logout",
                                      ),

                                      content: const Text(
                                        "Are you sure you want to logout?",
                                      ),

                                      actions: [

                                        /// CANCEL BUTTON
                                        TextButton(
                                          onPressed: () {
                                            Navigator.pop(
                                              context,
                                            );
                                          },

                                          child: const Text(
                                            "Cancel",
                                          ),
                                        ),

                                        /// LOGOUT BUTTON
                                        ElevatedButton(
                                          style:
                                          ElevatedButton.styleFrom(
                                            backgroundColor:
                                            Colors.red,

                                            shape:
                                            RoundedRectangleBorder(
                                              borderRadius:
                                              BorderRadius.circular(10),
                                            ),
                                          ),

                                          onPressed: () async {

                                            try {

                                              final authVM =
                                              Provider.of<AuthViewmodel>(
                                                context,
                                                listen: false,
                                              );

                                              /// LOGOUT
                                              await authVM.logout();

                                              /// CLEAR PREFS
                                              final prefs =
                                              await SharedPreferences
                                                  .getInstance();

                                              await prefs.clear();

                                              /// NAVIGATE LOGIN
                                              Navigator.pushNamedAndRemoveUntil(
                                                context,
                                                "/login",
                                                    (route) => false,
                                              );

                                            } catch (e) {

                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(

                                                SnackBar(
                                                  content: Text(
                                                    "Logout Failed: $e",
                                                  ),
                                                ),
                                              );
                                            }
                                          },

                                          child: const Text(
                                            "Logout",
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                );
                              }

                              /// ================= NORMAL NAVIGATION =================
                              else {

                                if (item.route.isNotEmpty) {

                                  Navigator.pushNamed(
                                    context,
                                    item.route,
                                  );
                                }
                              }
                            },
                          ),
                        );
                      },
                    ),
                  ),

                  /// ================= FOOTER =================
                  Padding(
                    padding: const EdgeInsets.only(
                      bottom: 20,
                    ),

                    child: Text(
                      "App Version 1.0.0",

                      style: TextStyle(
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        // drawer: Consumer<DrawerViewmodel>(
        //   builder: (context, vm, child) {
        //     return Drawer(
        //       child: Column(
        //         children: [
        //           ///HEADER
        //           Container(
        //             width: double.infinity,
        //             padding: EdgeInsets.symmetric(horizontal: 20, vertical: 60),
        //             child: Column(
        //               crossAxisAlignment: CrossAxisAlignment.start,
        //               children: [
        //                 Text(
        //                   authVm.user.name,
        //                   style: TextStyle(
        //                     fontSize: 20,
        //                     fontWeight: FontWeight.bold,
        //                   ),
        //                 ),
        //                 SizedBox(height: 4),
        //                 Text(authVm.user.email),
        //               ],
        //             ),
        //           ),
        //
        //           Divider(),
        //           ///LIST
        //           Expanded(
        //             child: ListView.builder(
        //               itemCount: vm.items.length,
        //               itemBuilder: (context, index) {
        //                 final item = vm.items[index];
        //
        //                 return ListTile(
        //                   leading: Icon(item.icon),
        //                   title: Text(item.title),
        //
        //                   onTap: () {
        //                     Navigator.pop(context); // drawer close
        //
        //                     // logout check
        //                     if (item.route == "/logout") {
        //                       showDialog(
        //                         context: context,
        //                         builder: (context) {
        //                           return AlertDialog(
        //                             title: Text("Logout"),
        //                             content: Text(
        //                               "Are you sure you want to logout?",
        //                             ),
        //
        //                             actions: [
        //                               // NO button
        //                               TextButton(
        //                                 onPressed: () {
        //                                   Navigator.pop(context);
        //                                 },
        //                                 child: Text("No"),
        //                               ),
        //
        //                               // YES button
        //                               TextButton(
        //                                 onPressed: () async {
        //                                   final authVM =
        //                                   Provider.of<AuthViewmodel>(
        //                                     context,
        //                                     listen: false,
        //                                   );
        //                                   await authVM.logout();
        //                                   final prefs = await SharedPreferences.getInstance();
        //                                   prefs.clear();
        //                                   Navigator.pushNamedAndRemoveUntil(
        //                                     context,
        //                                     "/login",
        //                                         (route) => false,
        //                                   );
        //                                 },
        //                                 child: Text("Yes"),
        //                               ),
        //                             ],
        //                           );
        //                         },
        //                       );
        //                     } else {
        //                       // normal navigation
        //
        //                       Navigator.pushNamed(context, item.route);
        //                     }
        //                   },
        //                 );
        //               },
        //             ),
        //           ),
        //         ],
        //       ),
        //     );
        //   },
        // ),

        appBar: AppBar(

          backgroundColor: Colors.transparent,
          flexibleSpace: Container(

            decoration: BoxDecoration(

              gradient: LinearGradient(

                begin: Alignment.topLeft,
                end: Alignment.bottomRight,

                colors: [
                  AppColors.primaryButton,
                  AppColors.secondaryButton,
                ],
              ),
            ),
          ),
          ///menu icon
          leading: Builder(
            builder: (context) => IconButton(
              icon: Icon(AppIcons.menu, color: Colors.white),
              onPressed: () {
                Scaffold.of(context).openDrawer();
              },
            ),
          ),

          title: GestureDetector(
            onTap: () {
              Navigator.pushNamed(context, "/search");
            },
            child: AbsorbPointer(
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: "Search Services...",
                    prefixIcon: Icon(AppIcons.search),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ),
          ),
          // GestureDetector(
          //   onTap: (){
          //     Navigator.pushNamed(context, "/search");
          //   },
          //   child: Container(
          //     height: 40,
          //     decoration: BoxDecoration(
          //       color: Colors.white,
          //       borderRadius: BorderRadius.circular(30),
          //     ),
          //     //Search Services
          //     child: TextField(
          //       onChanged: (value) {
          //         serviceVM.setSearchQuery(value);
          //       },
          //       decoration: InputDecoration(
          //         hintText: "Search Services...",
          //         prefixIcon: Icon(AppIcons.search),
          //         border: InputBorder.none,
          //         contentPadding: EdgeInsets.symmetric(vertical: 8),
          //       ),
          //     ),
          //   ),
          // ),
          //walet button
          actions: [
            Padding(
              padding: EdgeInsets.only(right: 16),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => WalletScreen()),
                  );
                },
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.wallet, color: Colors.white),
                    SizedBox(height: 2),
                    Text(
                      "Wallet",
                      style: TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        body:
        SingleChildScrollView(
          padding: const EdgeInsets.only(
            bottom: 140,
          ),

          child: serviceVM.filteredAllServices.isNotEmpty
              ? ListView.builder(
            padding: EdgeInsets.all(16),
            itemCount: serviceVM.filteredAllServices.length,
            itemBuilder: (context, index) {
              final service = serviceVM.filteredAllServices[index];
              return ListTile(
                title: Text(service.title),
                subtitle: Text("₹ ${service.price}"),
                onTap: () {
                  serviceVM.selectService(service);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ServiceDetailScreen(
                        serviceTitle: service.title,
                      ),
                    ),
                  );
                },
              );
            },
          )
              : SingleChildScrollView(
            child: Column(
              children: [
                SizedBox(height: 16),
          
                Consumer<BannerViewmodel>(
                  builder: (context, bannerVM, child) {
                    if (bannerVM.loading) {
                      return SizedBox(
                        height: 210,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.asset(
                              'assets/images/ac_services_banner.png',
                              fit: BoxFit.fill,
                              width: double.infinity,
                            ),
                          ),
                        ),
                      );
                    }
          
                    // 2️⃣ EMPTY → also show static image
                    if (bannerVM.banners.isEmpty) {
                      return SizedBox(
                        height: 210,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.asset(
                              'assets/images/ac_services_banner.png',
                              fit: BoxFit.fill,
                              width: double.infinity,
                            ),
                          ),
                        ),
                      );
                    }
          
                    // 3️⃣ DATA READY → show carousel
                    return CarouselSlider(
                      options: CarouselOptions(
                        height: 210,
                        autoPlay: true,
                        enlargeCenterPage: false,
                        viewportFraction: 1.0,
                      ),
                      items: bannerVM.banners.map((banner) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              banner.image,
                              fit: BoxFit.fill,
                              width: double.infinity,
                              loadingBuilder: (context, child, progress) {
                                if (progress == null) return child;
                                // while individual image loads → keep static image feel
                                return Image.asset(
                                  'assets/images/ac_services_banner.png',
                                  fit: BoxFit.fill,
                                  width: double.infinity,
                                );
                              },
                            ),
                          ),
                        );
                      }).toList(),
                    );
                  },
                ),
                SizedBox(height: 24),
          
                // Categories Title
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "Categories",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
          
                SizedBox(height: 16),
          
                Consumer<CategoryViewmodelApi>(
                  builder: (context, serviceVM, child) {
                    if (serviceVM.categoryLoading) {
                      return Padding(
          
                        padding:
                        const EdgeInsets.symmetric(horizontal: 12),
          
                        child: GridView.builder(
          
                          shrinkWrap: true,
          
                          primary: false,
          
                          physics:
                          const NeverScrollableScrollPhysics(),
          
                          padding: EdgeInsets.zero,
          
                          itemCount: 12,
          
                          gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
          
                            crossAxisCount: 4,
          
                            crossAxisSpacing: 20,
          
                            mainAxisSpacing: 10,
          
                            childAspectRatio: 0.92,
                          ),
          
                          itemBuilder: (context, index) {
          
                            return Shimmer.fromColors(
          
                              baseColor: Colors.grey.shade300,
          
                              highlightColor:
                              Colors.grey.shade100,
          
                              child: Container(
          
                                decoration: BoxDecoration(
          
                                  color: Colors.white,
          
                                  borderRadius:
                                  BorderRadius.circular(12),
                                ),
          
                                child: Column(
          
                                  mainAxisSize:
                                  MainAxisSize.min,
          
                                  mainAxisAlignment:
                                  MainAxisAlignment.center,
          
                                  children: [
          
                                    /// IMAGE PLACEHOLDER
                                    Container(
          
                                      height: 45,
                                      width: 45,
          
                                      decoration: BoxDecoration(
          
                                        color: Colors.white,
          
                                        borderRadius:
                                        BorderRadius.circular(10),
                                      ),
                                    ),
          
                                    const SizedBox(height: 8),
          
                                    /// TEXT PLACEHOLDER
                                    Container(
          
                                      height: 10,
                                      width: 35,
          
                                      decoration: BoxDecoration(
          
                                        color: Colors.white,
          
                                        borderRadius:
                                        BorderRadius.circular(4),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    }
                    if (serviceVM.categories.isEmpty) {
                      return const Center(
                        child: Text("No Categories Found"),
                      );
                    }
                    return Padding(
          
                      padding:
                      const EdgeInsets.symmetric(horizontal: 12),
          
                      child: GridView.builder(
          
                        shrinkWrap: true,
          
                        primary: false,
          
                        physics:
                        const NeverScrollableScrollPhysics(),
          
                        padding: EdgeInsets.zero,
          
                        itemCount:
                        serviceVM.categories.take(12).length,
          
                        gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          crossAxisSpacing: 20,
          
                          mainAxisSpacing: 1,
          
                          childAspectRatio: 0.82,
                        ),
          
                        itemBuilder: (context, index) {
          
                          final category =
                          serviceVM.categories[index];
          
                          return CategoryCard(
          
                            title: category.name,
          
                            imageUrl: category.image,
          
                            onTap: () {
          
                              Navigator.push(
          
                                context,
          
                                MaterialPageRoute(
          
                                  builder: (_) =>
                                      ServicesListScreen(
                                        categoryName:
                                        category.name,
                                      ),
                                ),
                              );
                            },
                          );
                        },
                      ),
                    );
          
                  },
                ),
          
                SizedBox(height: 8),
          
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Trending Services",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 24),
                // Trending services list (same as before)
                Consumer<TrendingServiceViewmodel>(
                  builder: (context, trendingVM, child) {
                    if (trendingVM.loading) {
                      return SizedBox(
                        height: 260,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: 5,
                          padding: const EdgeInsets.only(left: 16),
                          itemBuilder: (context, index) {
                            return Shimmer.fromColors(
                              baseColor: Colors.grey.shade300,
                              highlightColor: Colors.grey.shade100,
                              child: Container(
                                width: 170,
                                margin: const EdgeInsets.only(right: 12, bottom: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // IMAGE PLACEHOLDER
                                    Container(
                                      height: 130,
                                      width: double.infinity,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.vertical(
                                          top: Radius.circular(16),
                                        ),
                                      ),
                                    ),
          
                                    Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // TITLE
                                          Container(
                                            height: 12,
                                            width: 100,
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                          ),
          
                                          const SizedBox(height: 10),
          
                                          // PRICE ROW
                                          Row(
                                            children: [
                                              Container(
                                                height: 14,
                                                width: 50,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                              ),
          
                                              const SizedBox(width: 10),
          
                                              Container(
                                                height: 12,
                                                width: 40,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    }
          
                    if (trendingVM.services.isEmpty) {
                      return const SizedBox(
                        height: 190,
                        child: Center(
                          child: Text("No Trending Services"),
                        ),
                      );
                    }
                    return SizedBox(
                      height: 260,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: trendingVM.services.length,
                        itemBuilder: (context, index){
                          final service =
                          trendingVM.services[index];
                          return GestureDetector(
                            onTap: (){
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ServiceDetailScreen(
                                    serviceTitle: service.title,
                                  ),
                                ),
                              );
                            },
                            child: Container(
                              width: 170,
                              margin: const EdgeInsets.only(
                                left: 16,
                                bottom: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius:
                                BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment:
                                CrossAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    height: 145,
                                    child: ClipRRect(
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(16),
                                      ),
                                      child: Stack(
                                        children: [
                                          /// IMAGE
                                          Image.network(
          
                                            service.image,
          
                                            height: 145,
          
                                            width: double.infinity,
          
                                            fit: BoxFit.cover,
          
                                            /// LOADING
                                            loadingBuilder:
                                                (context, child, progress) {
          
                                              if (progress == null) {
                                                return child;
                                              }
          
                                              return Container(
          
                                                color: Colors.grey.shade200,
          
                                                child: const Center(
          
                                                  child:
                                                  CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                  ),
                                                ),
                                              );
                                            },
          
                                            /// ERROR
                                            errorBuilder:
                                                (context, error, stackTrace) {
          
                                              return Container(
          
                                                width: double.infinity,
          
                                                color: Colors.grey.shade100,
          
                                                child: Column(
          
                                                  mainAxisAlignment:
                                                  MainAxisAlignment.center,
          
                                                  children: [
          
                                                    Icon(
          
                                                      Icons
                                                          .image_not_supported_outlined,
          
                                                      size: 36,
          
                                                      color:
                                                      Colors.grey.shade500,
                                                    ),
          
                                                    const SizedBox(height: 8),
          
                                                    Text(
          
                                                      "Image unavailable",
          
                                                      style: TextStyle(
          
                                                        fontSize: 12,
          
                                                        color:
                                                        Colors.grey.shade600,
          
                                                        fontWeight:
                                                        FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            },
                                          ),
          
                                          /// DARK OVERLAY
                                          Container(
          
                                            height: 145,
          
                                            decoration: BoxDecoration(
          
                                              gradient: LinearGradient(
          
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
          
                                                colors: [
          
                                                  Colors.transparent,
          
                                                  Colors.black.withOpacity(0.25),
                                                ],
                                              ),
                                            ),
                                          ),
          
                                          /// DISCOUNT TAG
                                          Positioned(
          
                                            top: 4,
                                            right: 4,
          
                                            child: Container(
          
                                              padding:
                                              const EdgeInsets.symmetric(
                                                horizontal: 10,
                                                vertical: 5,
                                              ),
          
                                              decoration: BoxDecoration(
          
                                                color: Colors.green,
          
                                                borderRadius:
                                                BorderRadius.circular(20),
          
                                                boxShadow: [
          
                                                  BoxShadow(
          
                                                    color:
                                                    Colors.black.withOpacity(0.15),
          
                                                    blurRadius: 6,
          
                                                    offset: const Offset(0, 2),
                                                  ),
                                                ],
                                              ),
          
                                              child: const Text(
          
                                                "20% OFF",
          
                                                style: TextStyle(
          
                                                  color: Colors.white,
          
                                                  fontSize: 11,
          
                                                  fontWeight:
                                                  FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Padding(
          
                                    padding: const EdgeInsets.all(4),
          
                                    child: Column(
          
                                      crossAxisAlignment:
                                      CrossAxisAlignment.start,
          
                                      children: [
                                        SizedBox(height: 8,),
                                        /// TITLE
                                        Text(
                                          service.title,
                                          maxLines: 1,
          
                                          overflow:
                                          TextOverflow.ellipsis,
          
                                          style: const TextStyle(
          
                                            fontSize: 14,
          
                                            fontWeight:
                                            FontWeight.w600,
                                          ),
                                        ),
          
                                        const SizedBox(height: 6),
          
                                        /// RATING ROW
                                        Row(
          
                                          children: [
          
                                            Icon(
                                              Icons.star,
                                              size: 16,
                                              color: Colors.orange,
                                            ),
          
                                            const SizedBox(width: 4),
          
                                            const Text(
          
                                              "4.8",
          
                                              style: TextStyle(
          
                                                fontSize: 13,
          
                                                fontWeight:
                                                FontWeight.w600,
                                              ),
                                            ),
          
                                            const SizedBox(width: 4),
          
                                            Text(
          
                                              "(120 Reviews)",
          
                                              style: TextStyle(
          
                                                fontSize: 12,
          
                                                color: Colors.grey.shade600,
                                              ),
                                            ),
                                          ],
                                        ),
          
                                        const SizedBox(height: 8),
          
                                        /// PRICE ROW
                                        Row(
          
                                          children: [
          
                                            Text(
          
                                              "₹ ${service.price}",
          
                                              style: TextStyle(
          
                                                fontSize: 16,
          
                                                fontWeight:
                                                FontWeight.bold,
          
                                                color: AppColors.black,
                                              ),
                                            ),
          
                                            const SizedBox(width: 8),
          
                                            Text(
          
                                              "₹ ${(service.price + 100)}",
          
                                              style: const TextStyle(
          
                                                fontSize: 13,
          
                                                color: Colors.grey,
          
                                                decoration:
                                                TextDecoration.lineThrough,
                                              ),
                                            ),
          
                                            const Spacer(),
          
          
                                          ],
                                        ),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
          
                SizedBox(height: 20),
                //  services title (FIXED)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "All Services",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
               SizedBox(height: 24),
          
                Consumer<AllServiceViewmodel>(
                  builder: (context, trendingVM, child) {
          
                    if (trendingVM.loading) {
                      return SizedBox(
                        height: 220,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: 5,
                          padding: const EdgeInsets.only(left: 16),
                          itemBuilder: (context, index) {
                            return Shimmer.fromColors(
                              baseColor: Colors.grey.shade300,
                              highlightColor: Colors.grey.shade100,
                              child: Container(
                                width: 170,
                                margin: const EdgeInsets.only(right: 12, bottom: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // IMAGE PLACEHOLDER
                                    Container(
                                      height: 130,
                                      width: double.infinity,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.vertical(
                                          top: Radius.circular(16),
                                        ),
                                      ),
                                    ),
          
                                    Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // TITLE
                                          Container(
                                            height: 12,
                                            width: 100,
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                          ),
          
                                          const SizedBox(height: 10),
          
                                          // PRICE ROW
                                          Row(
                                            children: [
                                              Container(
                                                height: 14,
                                                width: 50,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                              ),
          
                                              const SizedBox(width: 10),
          
                                              Container(
                                                height: 12,
                                                width: 40,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      );
                    }
          
                    if (trendingVM.services.isEmpty) {
                      return const SizedBox(
                        height: 190,
                        child: Center(
                          child: Text("No Trending Services"),
                        ),
                      );
                    }
          
                    return SizedBox(
                      height: 260,
          
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
          
                        itemCount: trendingVM.services.length,
          
                        itemBuilder: (context, index) {
          
                          final service =
                          trendingVM.services[index];
          
                          return GestureDetector(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ServiceDetailScreen(
                                    serviceTitle: service.title,
                                  ),
                                ),
                              );
                            },
          
                            child: Container(
                              width: 170,
                              margin: const EdgeInsets.only(
                                left: 16,
                                bottom: 8,
                              ),
          
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius:
                                BorderRadius.circular(16),
          
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.08),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
          
                              child: Column(
                                crossAxisAlignment:
                                CrossAxisAlignment.start,
          
                                children: [
                                  SizedBox(
          
                                    height: 145,
          
                                    child: ClipRRect(
          
                                      borderRadius: const BorderRadius.vertical(
                                        top: Radius.circular(16),
                                      ),
          
                                      child: Stack(
          
                                        children: [
          
                                          /// IMAGE
                                          Image.network(
          
                                            service.image,
          
                                            height: 145,
          
                                            width: double.infinity,
          
                                            fit: BoxFit.cover,
          
                                            /// LOADING
                                            loadingBuilder:
                                                (context, child, progress) {
          
                                              if (progress == null) {
                                                return child;
                                              }
          
                                              return Container(
          
                                                color: Colors.grey.shade200,
          
                                                child: const Center(
          
                                                  child:
                                                  CircularProgressIndicator(
                                                    strokeWidth: 2,
                                                  ),
                                                ),
                                              );
                                            },
          
                                            /// ERROR
                                            errorBuilder:
                                                (context, error, stackTrace) {
          
                                              return Container(
          
                                                width: double.infinity,
          
                                                color: Colors.grey.shade100,
          
                                                child: Column(
          
                                                  mainAxisAlignment:
                                                  MainAxisAlignment.center,
          
                                                  children: [
          
                                                    Icon(
          
                                                      Icons
                                                          .image_not_supported_outlined,
          
                                                      size: 36,
          
                                                      color:
                                                      Colors.grey.shade500,
                                                    ),
          
                                                    const SizedBox(height: 8),
          
                                                    Text(
          
                                                      "Image unavailable",
          
                                                      style: TextStyle(
          
                                                        fontSize: 12,
          
                                                        color:
                                                        Colors.grey.shade600,
          
                                                        fontWeight:
                                                        FontWeight.w500,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            },
                                          ),
          
                                          /// DARK OVERLAY
                                          Container(
          
                                            height: 145,
          
                                            decoration: BoxDecoration(
          
                                              gradient: LinearGradient(
          
                                                begin: Alignment.topCenter,
                                                end: Alignment.bottomCenter,
          
                                                colors: [
          
                                                  Colors.transparent,
          
                                                  Colors.black.withOpacity(0.25),
                                                ],
                                              ),
                                            ),
                                          ),
          
                                          /// DISCOUNT TAG
                                          Positioned(
          
                                            top: 4,
                                            right: 4,
          
                                            child: Container(
          
                                              padding:
                                              const EdgeInsets.symmetric(
                                                horizontal: 10,
                                                vertical: 5,
                                              ),
          
                                              decoration: BoxDecoration(
          
                                                color: Colors.green,
          
                                                borderRadius:
                                                BorderRadius.circular(20),
          
                                                boxShadow: [
          
                                                  BoxShadow(
          
                                                    color:
                                                    Colors.black.withOpacity(0.15),
          
                                                    blurRadius: 6,
          
                                                    offset: const Offset(0, 2),
                                                  ),
                                                ],
                                              ),
          
                                              child: const Text(
          
                                                "20% OFF",
          
                                                style: TextStyle(
          
                                                  color: Colors.white,
          
                                                  fontSize: 11,
          
                                                  fontWeight:
                                                  FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  Padding(
          
                                    padding: const EdgeInsets.all(4),
          
                                    child: Column(
          
                                      crossAxisAlignment:
                                      CrossAxisAlignment.start,
          
                                      children: [
                                        SizedBox(height: 8,),
                                        /// TITLE
                                        Text(
          
                                          service.title,
          
                                          maxLines: 1,
          
                                          overflow:
                                          TextOverflow.ellipsis,
          
                                          style: const TextStyle(
          
                                            fontSize: 14,
          
                                            fontWeight:
                                            FontWeight.w600,
                                          ),
                                        ),
          
                                        const SizedBox(height: 6),
          
                                        /// RATING ROW
                                        Row(
          
                                          children: [
          
                                            Icon(
                                              Icons.star,
                                              size: 16,
                                              color: Colors.orange,
                                            ),
          
                                            const SizedBox(width: 4),
          
                                            const Text(
          
                                              "4.8",
          
                                              style: TextStyle(
          
                                                fontSize: 13,
          
                                                fontWeight:
                                                FontWeight.w600,
                                              ),
                                            ),
          
                                            const SizedBox(width: 4),
          
                                            Text(
          
                                              "(120 Reviews)",
          
                                              style: TextStyle(
          
                                                fontSize: 12,
          
                                                color: Colors.grey.shade600,
                                              ),
                                            ),
                                          ],
                                        ),
          
                                        const SizedBox(height: 8),
          
          
                                        /// PRICE ROW
                                        Row(
          
                                          children: [
          
                                            Text(
          
                                              "₹ ${service.price}",
          
                                              style: TextStyle(
          
                                                fontSize: 16,
          
                                                fontWeight:
                                                FontWeight.bold,
          
                                                color: AppColors.black,
                                              ),
                                            ),
          
                                            const SizedBox(width: 8),
          
                                            Text(
          
                                              "₹ ${(service.price + 100)}",
          
                                              style: const TextStyle(
          
                                                fontSize: 13,
          
                                                color: Colors.grey,
          
                                                decoration:
                                                TextDecoration.lineThrough,
                                              ),
                                            ),
          
                                            const Spacer(),
          
          
                                          ],
                                        ),
                                      ],
                                    ),
                                  )
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
          
                SizedBox(height: 20),
          
          
                ///Refer to Earn
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => ReferScreen()),
                      );
                    },
                    child: Container(
                      height: 130,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        color: Colors.blue.shade50,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          ///  LEFT SIDE (TEXT)
                          // Expanded(
                          //   flex: 2,
                          //   child:
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment:
                              CrossAxisAlignment.start,
                              children: [
                                Text(
                                  "Refer & Earn 💰",
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
          
                                SizedBox(height: 6),
          
                                Text(
                                  "Invite friends & earn rewards",
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[700],
                                  ),
                                ),
          
                                SizedBox(height: 8),
          
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    borderRadius: BorderRadius.circular(
                                      8,
                                    ),
                                  ),
                                  child: Text(
                                    "Refer Now",
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          //),
          
                          /// RIGHT SIDE (IMAGE)
                          SizedBox(
                            height: 100,
                            width: 100,
                            child: Center(
                              child: Image.asset(
                                "assets/images/giftt.png",
                                height: double.infinity,
                                fit: BoxFit.cover,
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
          ),
        ),
      );
  }
}
