import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shimmer/shimmer.dart';

import '../../../utils/app_colors.dart';
//import '../utils/app_colors.dart';

class AboutUsPage extends StatefulWidget {
  const AboutUsPage({super.key});

  @override
  State<AboutUsPage> createState() =>
      _AboutUsPageState();
}

class _AboutUsPageState extends State<AboutUsPage> {

  Map<String, dynamic>? aboutData;

  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchAboutData();
  }

  Future<void> fetchAboutData() async {

    try {

      final response = await http.get(
        Uri.parse(
          "https://backend-1-ux3b.onrender.com/api/about",
        ),
      );

      if (response.statusCode == 200) {

        setState(() {

          aboutData = jsonDecode(response.body);

          isLoading = false;
        });

      } else {

        setState(() {
          isLoading = false;
        });
      }

    } catch (e) {

      setState(() {
        isLoading = false;
      });

      debugPrint("About Error: $e");
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: const Color(0xfff5f7fb),

      body: isLoading

          ? buildShimmerLoader()

          : aboutData == null

          ? const Center(
        child: Text(
          "Failed to load About Us",
        ),
      )

          : CustomScrollView(

        slivers: [

          /// ================= APP BAR =================
          SliverAppBar(

            expandedHeight: 240,

            pinned: true,

            elevation: 0,

            backgroundColor:
            AppColors.primaryButton,

            leading: IconButton(

              icon: const Icon(
                Icons.arrow_back_ios_new,
                color: Colors.white,
              ),

              onPressed: () {
                Navigator.pop(context);
              },
            ),

            flexibleSpace: FlexibleSpaceBar(

              centerTitle: true,

              // title: Text(
              //   aboutData!["title"] ?? "About Us",
              //
              //   style: const TextStyle(
              //     color: Colors.white,
              //     fontSize: 18,
              //     fontWeight: FontWeight.bold,
              //   ),
              // ),

              background: Container(

                decoration: BoxDecoration(

                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryButton,
                      AppColors.secondaryButton,
                    ],

                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),

                child: Column(
                  mainAxisAlignment:
                  MainAxisAlignment.center,

                  children: [

                    const SizedBox(height: 45),

                    /// ICON
                    Container(

                      padding:
                      const EdgeInsets.all(22),

                      decoration: BoxDecoration(

                        color: Colors.white24,

                        borderRadius:
                        BorderRadius.circular(25),
                      ),

                      child: const Icon(
                        Icons.business_center_rounded,
                        color: Colors.white,
                        size: 75,
                      ),
                    ),

                    const SizedBox(height: 20),

                    /// TITLE
                    Text(
                      aboutData!["title"],

                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          /// ================= BODY =================
          SliverToBoxAdapter(

            child: Padding(
              padding: const EdgeInsets.all(18),

              child: Column(
                crossAxisAlignment:
                CrossAxisAlignment.start,

                children: [

                  /// DESCRIPTION CARD
                  buildCard(
                    title: "Who We Are",
                    icon: Icons.info_outline_rounded,
                    content:
                    aboutData!["description"],
                  ),

                  const SizedBox(height: 22),

                  /// VISION CARD
                  buildCard(
                    title: "Our Vision",
                    icon: Icons.visibility_rounded,
                    content:
                    aboutData!["vision"],
                  ),

                  const SizedBox(height: 22),

                  /// MISSION CARD
                  buildCard(
                    title: "Our Mission",
                    icon: Icons.flag_rounded,
                    content:
                    aboutData!["mission"],
                  ),

                  const SizedBox(height: 28),

                  /// HIGHLIGHTS TITLE
                  Row(
                    children: [

                      Icon(
                        Icons.star_rounded,
                        color:
                        AppColors.primaryButton,
                      ),

                      const SizedBox(width: 10),

                      const Text(
                        "Why Choose Us",

                        style: TextStyle(
                          fontSize: 22,
                          fontWeight:
                          FontWeight.bold,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),

                  /// HIGHLIGHTS LIST
                  ListView.builder(

                    shrinkWrap: true,

                    physics:
                    const NeverScrollableScrollPhysics(),

                    itemCount:
                    aboutData!["highlights"]
                        .length,

                    itemBuilder: (context, index) {

                      final item =
                      aboutData!["highlights"]
                      [index];

                      return Container(

                        margin:
                        const EdgeInsets.only(
                          bottom: 16,
                        ),

                        padding:
                        const EdgeInsets.all(18),

                        decoration: BoxDecoration(

                          color: Colors.white,

                          borderRadius:
                          BorderRadius.circular(20),

                          boxShadow: [

                            BoxShadow(
                              color: Colors.black
                                  .withOpacity(0.05),

                              blurRadius: 10,

                              offset:
                              const Offset(0, 4),
                            ),
                          ],
                        ),

                        child: Row(
                          crossAxisAlignment:
                          CrossAxisAlignment.start,

                          children: [

                            Container(

                              padding:
                              const EdgeInsets.all(
                                10,
                              ),

                              decoration:
                              BoxDecoration(

                                gradient:
                                LinearGradient(
                                  colors: [
                                    AppColors
                                        .primaryButton,

                                    AppColors
                                        .secondaryButton,
                                  ],
                                ),

                                borderRadius:
                                BorderRadius
                                    .circular(
                                  12,
                                ),
                              ),

                              child: const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),

                            const SizedBox(width: 15),

                            Expanded(
                              child: Text(
                                item,

                                style:
                                TextStyle(
                                  fontSize: 15.5,
                                  height: 1.7,
                                  color: Colors
                                      .grey
                                      .shade800,
                                  fontWeight:
                                  FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// ================= REUSABLE CARD =================
  Widget buildCard({
    required String title,
    required IconData icon,
    required String content,
  }) {

    return Container(

      padding: const EdgeInsets.all(20),

      decoration: BoxDecoration(

        color: Colors.white,

        borderRadius:
        BorderRadius.circular(22),

        boxShadow: [

          BoxShadow(
            color:
            Colors.black.withOpacity(0.05),

            blurRadius: 10,

            offset: const Offset(0, 4),
          ),
        ],
      ),

      child: Column(
        crossAxisAlignment:
        CrossAxisAlignment.start,

        children: [

          Row(
            children: [

              Container(

                padding:
                const EdgeInsets.all(10),

                decoration: BoxDecoration(

                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryButton,
                      AppColors.secondaryButton,
                    ],
                  ),

                  borderRadius:
                  BorderRadius.circular(14),
                ),

                child: Icon(
                  icon,
                  color: Colors.white,
                ),
              ),

              const SizedBox(width: 14),

              Expanded(
                child: Text(
                  title,

                  style: const TextStyle(
                    fontSize: 21,
                    fontWeight:
                    FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 18),

          Text(
            content,

            style: TextStyle(
              fontSize: 15.5,
              height: 1.8,
              color: Colors.grey.shade800,
            ),
          ),
        ],
      ),
    );
  }
  Widget buildShimmerLoader() {

    return Shimmer.fromColors(

      baseColor: Colors.grey.shade300,

      highlightColor: Colors.grey.shade100,

      child: ListView(

        padding: const EdgeInsets.all(18),

        children: [

          Container(
            height: 240,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(20),
            ),
          ),

          const SizedBox(height: 20),

          Container(
            height: 60,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(14),
            ),
          ),

          const SizedBox(height: 20),

          Container(
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius:
              BorderRadius.circular(14),
            ),
          ),

          const SizedBox(height: 20),

          ...List.generate(

            3,

                (index) => Container(

              margin:
              const EdgeInsets.only(
                bottom: 20,
              ),

              height: 180,

              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius:
                BorderRadius.circular(
                  20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}