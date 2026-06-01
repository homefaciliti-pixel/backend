import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../viewmodel/wallet_viewmodel.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      Provider.of<WalletViewmodel>(context, listen: false).loadWallet();
    });
  }

  @override
  Widget build(BuildContext context) {

    final walletVM = Provider.of<WalletViewmodel>(context);

    return Scaffold(
      appBar: AppBar(title: Text("My Wallet")),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            /// BALANCE CARD
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text("Wallet Balance", style: TextStyle(color: Colors.white)),
                  SizedBox(height: 10),
                  Text(
                    "₹ ${walletVM.balance}",
                    style: TextStyle(
                      fontSize: 28,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 30),

            /// test button (baad me hata dena)
            ElevatedButton(
              onPressed: () {
                walletVM.addMoney(50);
              },
              child: Text("Add ₹50"),
            )
          ],
        ),
      ),
    );
  }
}