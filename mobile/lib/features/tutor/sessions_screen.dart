import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final sessionsProvider = FutureProvider.autoDispose<List<TutoringListSessionsResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getTutoringApi().tutoringSessionsGet())));

class SessionsScreen extends ConsumerWidget {
  const SessionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(sessionsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Sesi Tutoring')),
      body: AsyncView(
        value: sessions,
        onRetry: () => ref.invalidate(sessionsProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.event_note, message: 'Belum ada sesi.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final s = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.video_library)),
                  title: Text('${s.studentName ?? ''} • ${s.teacherName ?? ''}'),
                  subtitle: Text('${formatDate(s.date)} ${s.startTime ?? ''}-${s.endTime ?? ''}\n${s.status ?? ''}'),
                  isThreeLine: true,
                  trailing: s.evidenceUrl != null ? const Icon(Icons.check_circle, color: Colors.green) : null,
                ),
              );
            },
          );
        },
      ),
    );
  }
}