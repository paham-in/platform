import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final notificationsProvider =
    FutureProvider.autoDispose<List<NotificationNotificationResponse>>((ref) async =>
        (await unwrap(ref.read(apiProvider).getNotificationApi().notificationsGet())).notifications ?? []);

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifikasi')),
      body: AsyncView(
        value: notifications,
        onRetry: () => ref.invalidate(notificationsProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.notifications_none, message: 'Belum ada notifikasi.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final n = items[i];
              return Card(
                color: n.isRead == true ? null : Theme.of(context).colorScheme.primaryContainer,
                child: ListTile(
                  leading: Icon(n.isRead == true ? Icons.notifications_none : Icons.notifications_active),
                  title: Text(n.title ?? '-'),
                  subtitle: Text('${n.body ?? ''}\n${formatDateTime(n.createdAt)}'),
                  isThreeLine: n.body?.isNotEmpty == true,
                  onTap: () async {
                    await unwrap(
                        ref.read(apiProvider).getNotificationApi().notificationsIdReadPatch(id: '${n.id}'));
                    ref.invalidate(notificationsProvider);
                    if (!context.mounted) return;
                    if (n.url != null && n.url!.isNotEmpty) context.push(n.url!);
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }
}