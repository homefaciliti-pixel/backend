
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
import '../../utils/app_icons.dart';
import '../../viewmodel/service_viewmodel.dart';
import '../../widgets/serivce_card.dart';
import '../Refer/refer_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {

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

            // Banner
            CarouselSlider(
              options: CarouselOptions(
                height: 160,
                autoPlay: true,
                enlargeCenterPage: true,
                viewportFraction: 0.9,
              ),
              items: [
                Container(
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                    ),
                  ),
                ),
                Container(
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                    ),
                  ),
                ),
                Container(
                  margin: EdgeInsets.symmetric(horizontal: 5),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                    ),
                  ),
                ),
              ],
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
                    title: category,
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ServicesListScreen(
                            categoryName: category,
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
                        "https://via.placeholder.com/150", // Api image badd me
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