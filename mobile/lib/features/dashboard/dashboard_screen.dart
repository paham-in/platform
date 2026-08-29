import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider.notifier).user;
    final timeGreeting = DateTime.now().hour < 12
        ? 'Selamat pagi'
        : DateTime.now().hour < 18
            ? 'Selamat siang'
            : 'Selamat malam';
    return Scaffold(
      appBar: AppBar(title: const Text('paham.in')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            '$timeGreeting, ${user?.name ?? ''}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          if (user?.subjects?.isNotEmpty == true) ...[
            const SizedBox(height: 4),
            Text(
              '${user?.subjects!.map((s) => s.name).join(', ')}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              _ShortcutCard(icon: Icons.book, color: Colors.indigo, label: 'Materi', onTap: () => context.go('/belajar')),
              _ShortcutCard(icon: Icons.quiz, color: Colors.orange, label: 'Paket Soal', onTap: () => context.push('/paket')),
              _ShortcutCard(icon: Icons.people, color: Colors.teal, label: 'Tutoring', onTap: () => context.push('/tutor')),
              _ShortcutCard(icon: Icons.receipt_long, color: Colors.green, label: 'Invoice', onTap: () => context.push('/invoice')),
              _ShortcutCard(icon: Icons.forum, color: Colors.purple, label: 'Forum', onTap: () => context.go('/forum')),
              _ShortcutCard(icon: Icons.badge, color: Colors.grey, label: 'Status', onTap: () => context.go('/profil')),
            ],
          ),
        ],
      ),
    );
  }
}

class _ShortcutCard extends StatelessWidget {
  const _ShortcutCard({required this.icon, required this.color, required this.label, required this.onTap});

  final IconData icon;
  final Color color;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 32),
              const SizedBox(height: 8),
              Text(label, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ),
      ),
    );
  }
}