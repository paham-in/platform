import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

const _tabs = [
  (Icons.home_outlined, Icons.home, 'Beranda'),
  (Icons.school_outlined, Icons.school, 'Belajar'),
  (Icons.forum_outlined, Icons.forum, 'Forum'),
  (Icons.notifications_outlined, Icons.notifications, 'Notifikasi'),
  (Icons.person_outline, Icons.person, 'Profil'),
];

class ShellScreen extends StatelessWidget {
  const ShellScreen({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) =>
            navigationShell.goBranch(index, initialLocation: index == navigationShell.currentIndex),
        destinations: [
          for (var i = 0; i < _tabs.length; i++)
            NavigationDestination(
              icon: Icon(_tabs[i].$1),
              selectedIcon: Icon(_tabs[i].$2),
              label: _tabs[i].$3,
            ),
        ],
      ),
    );
  }
}