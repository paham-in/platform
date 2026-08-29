import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AdminHomeScreen extends StatelessWidget {
  const AdminHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Panel Admin')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _AdminTile(icon: Icons.group, label: 'Pengguna', route: '/admin/users'),
          _AdminTile(icon: Icons.school, label: 'Kelas', route: '/admin/kelas'),
          _AdminTile(icon: Icons.menu_book, label: 'Mata Pelajaran', route: '/admin/mapel'),
          _AdminTile(icon: Icons.article, label: 'Materi', route: '/admin/materi'),
        ],
      ),
    );
  }
}

class _AdminTile extends StatelessWidget {
  const _AdminTile({required this.icon, required this.label, required this.route});

  final IconData icon;
  final String label;
  final String route;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: CircleAvatar(child: Icon(icon)),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push(route),
      ),
    );
  }
}