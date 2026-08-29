import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final adminUsersProvider = FutureProvider.autoDispose<List<UserAdminListUsersResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getAdminApi().adminUsersGet())));

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final users = ref.watch(adminUsersProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Pengguna')),
      body: AsyncView(
        value: users,
        onRetry: () => ref.invalidate(adminUsersProvider),
        builder: (items) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, i) {
            final u = items[i];
            return Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(u.name ?? '-', style: Theme.of(context).textTheme.titleSmall),
                          Text(u.email ?? '-', style: Theme.of(context).textTheme.bodySmall),
                          Wrap(
                            spacing: 4,
                            runSpacing: 4,
                            children: [
                              for (final r in u.roles ?? const <String>[])
                                Chip(label: Text(r), visualDensity: VisualDensity.compact, materialTapTargetSize: MaterialTapTargetSize.shrinkWrap),
                            ],
                          ),
                        ],
                      ),
                    ),
                    PopupMenuButton<String>(
                      onSelected: (role) async {
                        try {
                          await unwrap(ref.read(apiProvider).getAdminApi().adminUsersIdRolePatch(
                                id: u.id!,
                                body: UserAdminUpdateRoleRequest(roles: [role]),
                              ));
                          ref.invalidate(adminUsersProvider);
                        } catch (e) {
                          if (context.mounted) showError(context, e);
                        }
                      },
                      itemBuilder: (_) => const [
                        PopupMenuItem(value: 'student', child: Text('Set student')),
                        PopupMenuItem(value: 'teacher', child: Text('Set teacher')),
                        PopupMenuItem(value: 'admin', child: Text('Set admin')),
                        PopupMenuItem(value: 'superadmin', child: Text('Set superadmin')),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}