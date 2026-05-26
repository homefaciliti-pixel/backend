
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:userapp/utils/app_colors.dart';
import 'package:userapp/view/home/servicesdetail%20screen/services_detail_screen.dart';
import 'package:userapp/view/services/services_list_screen.dart';
import 'package:userapp/view/wallet_screen/wallet_screen.dart';
import 'package:userapp/viewmodel/auth_viewmodel.dart';
import 'package:userapp/viewmodel/drawer_viewmodel.dart';
import 'package:userapp/widgets/category_card.dart';
import 'package:userapp/services/api_service.dart';
import '../../model/categorymodel.dart';
import '../../utils/app_icons.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../../widgets/service_card.dart';
import '../Refer/refer_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentBannerIndex = 0;

  @override
  Widget build(BuildContext context) {
    //final categoryVM = Provider.of<CategoryViewModel>(context);
    final serviceVM = Provider.of<ServiceViewModel>(context);


    final authVm = Provider.of<AuthViewmodel>(context);




    //menu icons  //Drawer screen

    return Scaffold(

      drawer:Consumer<DrawerViewmodel>(builder:(context,vm, child){
        return Drawer(
          child: Column(
            children: [

              ///HEADER
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(horizontal:20,vertical:60),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(authVm.user.name,
                    style: TextStyle(fontSize: 20,fontWeight: FontWeight.bold),
                    ),
                    SizedBox(height: 4),
                    Text(authVm.user.email),
                  ],
                ),
              ),

              Divider(),

              ///LIST
              Expanded(child: ListView.builder(itemCount: vm.items.length,
                  itemBuilder:(context,index){
                final item =vm.items[index];

                return ListTile(
                  leading: Icon(item.icon),
                  title: Text(item.title),

                  onTap: () {

                    Navigator.pop(context); // drawer close

                    // logout check
                    if (item.route == "/logout") {

                      showDialog(
                        context: context,
                        builder: (context) {
                          return AlertDialog(
                            title: Text("Logout"),
                            content: Text("Are you sure you want to logout?"),

                            actions: [

                              // NO button
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                },
                                child: Text("No"),
                              ),

                              // YES button
                              TextButton(
                                onPressed: () async {

                                  final authVM =
                                  Provider.of<AuthViewmodel>(context, listen: false);

                                  await authVM.logout();

                                  Navigator.pushNamedAndRemoveUntil(
                                    context,
                                    "/login",
                                        (route) => false,
                                  );
                                },
                                child: Text("Yes"),
                              ),

                            ],
                          );
                        },
                      );

                    } else {

                      // normal navigation

                      Navigator.pushNamed(context, item.route);

                    }
                  },
                );
                  }))
            ],

          ),
        );


      }) ,


      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        backgroundColor: Colors.blue,
        elevation: 0,

                   ///menu icon

        leading: Builder(
          builder: (context) => IconButton(
            icon: Icon(AppIcons.menu, color: Colors.white),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
          ),
        ),


        title: Container(
          height: 40,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(30),
          ),


                            //Search Services


          child: TextField(
            onChanged: (value){
              serviceVM.setSearchQuery(value);
            },
            decoration: InputDecoration(
              hintText: "Search Services...",
              prefixIcon: Icon(AppIcons.search),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(vertical: 8),
            ),
          ),
        ),


                          //walet button


        actions: [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child:InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () {
                Navigator.push(context, MaterialPageRoute(
                    builder:(_)=> WalletScreen()

                ));


              },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [


                   Icon(
                    Icons.wallet,
                    color: Colors.white,
                  ),


                SizedBox(height: 2),

                Text(
                  "Wallet",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                ),
              ],
            ),
            )
          ),
        ],



      ),


      body: serviceVM.filteredAllServices.isNotEmpty
          ? ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: serviceVM.filteredAllServices.length,
        itemBuilder: (context, index) {

          final service = serviceVM.filteredAllServices[index];

          return ListTile(
            title: Text(service.title),
            subtitle: Text("₹ ${service.price}"),

            onTap: () {
              ///  SELECT SERVICE (MVVM)
              serviceVM.selectService(service);

              ///  OPEN DETAIL SCREEN
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ServiceDetailScreen(),
                ),
              );
            },
          );

        },
      ):




      SingleChildScrollView(
        child: Column(
          children: [
            SizedBox(height: 16),

            // Banner — 1080×540 px ratio (2:1)
            Builder(
              builder: (context) {
                final bannerWidth = MediaQuery.of(context).size.width * 0.95;
                final bannerHeight = bannerWidth / 2.0; // 1080:540 = 2:1
                return SizedBox(
                  height: bannerHeight,
                  child: CarouselSlider(
                    options: CarouselOptions(
                      height: bannerHeight,
                      autoPlay: serviceVM.banners.isNotEmpty,
                      autoPlayInterval: const Duration(seconds: 4),
                      enlargeCenterPage: true,
                      viewportFraction: 0.95,
                      onPageChanged: (index, reason) {
                        setState(() {
                          _currentBannerIndex = index;
                        });
                      },
                    ),
                    items: serviceVM.banners.isNotEmpty
                        ? serviceVM.banners.map((banner) {
                            return GestureDetector(
                        onTap: () {
                          if (banner.category.isNotEmpty) {
                            if (banner.category.toLowerCase() == 'refer' || banner.category.toLowerCase() == 'referral') {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const ReferScreen(),
                                ),
                              );
                            } else {
                              final matchedCategory = serviceVM.categories.firstWhere(
                                (c) => c.title == banner.category,
                                orElse: () => CategoryModel(id: '', title: banner.category, image: ''),
                              );
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ServicesListScreen(
                                    categoryName: banner.category,
                                    categoryImage: matchedCategory.image.isNotEmpty ? matchedCategory.image : null,
                                  ),
                                ),
                              );
                            }
                          }
                        },
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.12),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                // Placeholder / Background gradient if image fails or is loading
                                Container(
                                  color: Colors.grey.shade900,
                                ),
                                // The main image with slight dark color blend to mute brightness
                                Image.network(
                                  banner.image,
                                  fit: BoxFit.cover,
                                  color: Colors.black.withOpacity(0.15),
                                  colorBlendMode: BlendMode.darken,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      color: Colors.grey.shade900,
                                      child: const Center(
                                        child: Icon(
                                          Icons.image_not_supported_outlined,
                                          color: Colors.white24,
                                          size: 40,
                                        ),
                                      ),
                                    );
                                  },
                                  loadingBuilder: (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return Container(
                                      color: Colors.grey.shade900,
                                      child: Center(
                                        child: CircularProgressIndicator(
                                          value: loadingProgress.expectedTotalBytes != null
                                              ? loadingProgress.cumulativeBytesLoaded /
                                                  loadingProgress.expectedTotalBytes!
                                              : null,
                                          strokeWidth: 2,
                                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.white54),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                // Heavy dark gradient — bottom 60% is very dark so text is always readable
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.black.withOpacity(0.92),
                                        Colors.black.withOpacity(0.80),
                                        Colors.black.withOpacity(0.35),
                                        Colors.black.withOpacity(0.05),
                                      ],
                                      stops: const [0.0, 0.45, 0.75, 1.0],
                                      begin: Alignment.bottomCenter,
                                      end: Alignment.topCenter,
                                    ),
                                  ),
                                ),
                                // Styled Badge (Top Left)
                                if (banner.badge.isNotEmpty)
                                  Positioned(
                                    top: 12,
                                    left: 16,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: banner.badge.toLowerCase().contains("soon")
                                              ? [Colors.deepOrange, Colors.orangeAccent]
                                              : banner.badge.toLowerCase().contains("offer")
                                                  ? [Colors.blueAccent, Colors.indigoAccent]
                                                  : [Colors.purpleAccent, Colors.pinkAccent],
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                        boxShadow: const [
                                          BoxShadow(
                                            color: Colors.black26,
                                            blurRadius: 4,
                                            offset: Offset(0, 2),
                                          )
                                        ],
                                      ),
                                      child: Text(
                                        banner.badge,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ),
                                  ),
                                // Title, Subtitle, and Button (Bottom Left)
                                Positioned(
                                  bottom: 12,
                                  left: 16,
                                  right: 16,
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        banner.title,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.extrabold,
                                          letterSpacing: 0.2,
                                          shadows: [
                                            Shadow(
                                              color: Colors.black,
                                              blurRadius: 8,
                                              offset: Offset(0, 2),
                                            )
                                          ]
                                        ),
                                      ),
                                      if (banner.subtitle.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          banner.subtitle,
                                          style: TextStyle(
                                            color: Colors.white.withOpacity(0.95),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w500,
                                            shadows: const [
                                              Shadow(
                                                color: Colors.black87,
                                                blurRadius: 4,
                                                offset: Offset(0, 1),
                                              )
                                            ]
                                          ),
                                        ),
                                      ],
                                      if (banner.buttonText.isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(30),
                                            boxShadow: const [
                                              BoxShadow(
                                                color: Colors.black26,
                                                blurRadius: 4,
                                                offset: Offset(0, 2),
                                              )
                                            ],
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Text(
                                                banner.buttonText,
                                                style: const TextStyle(
                                                  color: Colors.black87,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              const Icon(
                                                Icons.arrow_forward_ios,
                                                size: 8,
                                                color: Colors.black87,
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                        }).toList()
                        : [
                            Container(
                              margin: const EdgeInsets.symmetric(horizontal: 5),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                gradient: LinearGradient(
                                  colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                                ),
                              ),
                            )
                          ],
                  ),
                );
              },
            ),
            if (serviceVM.banners.isNotEmpty) ...[
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: serviceVM.banners.asMap().entries.map((entry) {
                  bool isActive = _currentBannerIndex == entry.key;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeInOut,
                    width: isActive ? 20.0 : 8.0,
                    height: 8.0,
                    margin: const EdgeInsets.symmetric(horizontal: 4.0),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4.0),
                      gradient: isActive
                          ? LinearGradient(
                              colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            )
                          : null,
                      color: isActive ? null : Colors.grey.withOpacity(0.3),
                    ),
                  );
                }).toList(),
              ),
            ],

            SizedBox(height: 24),

            // Categories Title

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    "Categories",
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            SizedBox(height: 16),

            // Categories Grid (MVVM)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: serviceVM.categories.map((category) {
                  return CategoryCard(
                    title: category.title,
                    image: category.image.isNotEmpty ? category.image : null,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ServicesListScreen(
                            categoryName: category.title,
                            categoryImage: category.image.isNotEmpty ? category.image : null,
                          ),
                        ),
                      );
                    },
                  );
                }).toList(),
              ),
            ),

            SizedBox(height: 24),

            // Trending services title (FIXED)

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Trending services",
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ),

            // Trending services list (same as before)

            SizedBox(
              height: 190,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: serviceVM.trendingServices.length,
                itemBuilder: (context, index) {

                  final service = serviceVM.trendingServices[index];

                  return ServiceCard(
                    service: service,
                    onTap: () {

                      ///  SELECT SERVICE (MVVM)
                      serviceVM.selectService(service);

                      ///  OPEN DETAIL SCREEN
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ServiceDetailScreen(),
                        ),
                      );

                    },
                  );
                },
              ),
            ),

            SizedBox(height: 20),

                             ///Refer to Earn
        Padding(
          padding: const EdgeInsets.all(16),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ReferScreen(),
                ),
              );
            },
            child: Container(
              height: 130,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Colors.blue.shade50,
              ),
              child: Row(
                children: [

                                      ///  LEFT SIDE (TEXT)
                  Expanded(
                    flex: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                            style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                          ),

                          SizedBox(height: 8),

                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.blue,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              "Refer Now",
                              style: TextStyle(fontSize: 12, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                                /// RIGHT SIDE (IMAGE)
                  Expanded(
                    flex: 1,
                    child: ClipRRect(
                      borderRadius: BorderRadius.horizontal(
                        right: Radius.circular(16),
                      ),
                      child: Image.network(
                        "${ApiService.baseUrl}/assets/banners/refer_earn_banner.png",
                        height: double.infinity,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        )


          ],
        ),
      ),
    );
  }
}