import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DeleteAccountPage extends StatefulWidget {
  const DeleteAccountPage({super.key});

  @override
  State<DeleteAccountPage> createState() => _DeleteAccountPageState();
}

class _DeleteAccountPageState extends State<DeleteAccountPage> {

  static const String googleFormUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSc4PdojfxsTE1neJVeAp6ZMaolT9oTDRzyEeVYgcVE_9P-eJw/viewform?usp=publish-editor';
 // "https://docs.google.com/forms/d/e/1FAIpQLSc4PdojfxsTE1neJVeAp6ZMaolT9oTDRzyEeVYgcVE_9P-eJw/viewform?usp=header";
      //'https://docs.google.com/forms/d/e/1FAIpQLSc4PdojfxsTE1neJVeAp6ZMaolT9oTDRzyEeVYgcVE_9P-eJw/viewform?usp=sharing&ouid=111835306989490531005';

  late final WebViewController controller;

  @override
  void initState() {
    super.initState();

    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(

          onPageFinished: (url) async {

            /// Google form submit hone ke baad
            /// url me formResponse aata hai

            if (url.contains("formResponse")) {

              await logoutAndClearData();
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(googleFormUrl));
  }

  Future<void> logoutAndClearData() async {

    final prefs = await SharedPreferences.getInstance();

    /// token clear
    await prefs.remove("token");

    /// agar aur data hai to
    await prefs.clear();

    if (!mounted) return;

    Navigator.pushNamedAndRemoveUntil(
      context,
      '/login',
          (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      appBar: AppBar(
        title: const Text("Delete Account"),
      ),

      body: WebViewWidget(
        controller: controller,
      ),
    );
  }
}