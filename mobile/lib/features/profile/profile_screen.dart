import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../shared/widgets/async_view.dart';
import '../auth/auth_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider.notifier);
    final user = auth.user;
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Profil')),
      body: user == null
          ? const EmptyState(icon: Icons.person_outline, message: 'Tidak ada data pengguna.')
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        if (user.avatarUrl != null)
                          ClipOval(
                            child: Image.network(user.avatarUrl!, width: 56, height: 56,
                                errorBuilder: (_, _, _) => const CircleAvatar(radius: 28, child: Icon(Icons.person))),
                          )
                        else
                          const CircleAvatar(radius: 28, child: Icon(Icons.person)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(user.name ?? '-', style: theme.textTheme.titleLarge),
                              Text(user.email ?? '-', style: theme.textTheme.bodySmall),
                              const SizedBox(height: 4),
                              Wrap(
                                spacing: 4,
                                children: [
                                  for (final r in user.roles ?? <String>[])
                                    Chip(label: Text(r), visualDensity: VisualDensity.compact),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _MenuTile(icon: Icons.quiz_outlined, label: 'Paket Soal', onTap: () => context.push('/paket')),
                _MenuTile(icon: Icons.people_outline, label: 'Tutoring', onTap: () => context.push('/tutor')),
                _MenuTile(icon: Icons.receipt_long_outlined, label: 'Invoice', onTap: () => context.push('/invoice')),
                if (auth.isAdmin) ...[
                  const Divider(),
                  _MenuTile(icon: Icons.admin_panel_settings, label: 'Panel Admin', onTap: () => context.push('/admin')),
                ],
                const Divider(height: 24),
                FilledButton.tonalIcon(
                  onPressed: () async {
                    final ok = await confirmDialog(context,
                        title: 'Keluar', message: 'Yakin ingin keluar dari paham.in?');
                    if (ok) ref.read(authControllerProvider.notifier).logout();
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Keluar'),
                ),
              ],
            ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: ListTile(
        leading: Icon(icon),
        title: Text(label),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}