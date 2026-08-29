import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/formatters.dart';
import '../../shared/widgets/async_view.dart';

final bookingsProvider = FutureProvider.autoDispose<List<TutoringListBookingsResponse>>((ref) async =>
    (await unwrap(ref.read(apiProvider).getTutoringApi().tutoringBookingsGet())));

class BookingsScreen extends ConsumerWidget {
  const BookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(bookingsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tutoring'),
        actions: [
          IconButton(
            tooltip: 'Sesi',
            icon: const Icon(Icons.event_note),
            onPressed: () => context.push('/tutor/sesi'),
          ),
          IconButton(
            tooltip: 'Pendapatan',
            icon: const Icon(Icons.payments_outlined),
            onPressed: () => context.push('/tutor/pendapatan'),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/tutor/baru'),
        icon: const Icon(Icons.add),
        label: const Text('Buat Booking'),
      ),
      body: AsyncView(
        value: bookings,
        onRetry: () => ref.invalidate(bookingsProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(
                icon: Icons.people_outline, message: 'Belum ada booking.', action: null);
          }
          return ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final b = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: Text('${b.subjectName ?? ''} • ${b.teacherName ?? ''}'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${formatDate(b.date)} ${b.startTime ?? ''}-${b.endTime ?? ''}'),
                      Text('${b.mode ?? ''} • ${b.sessionCount ?? 0} sesi'),
                    ],
                  ),
                  isThreeLine: true,
                  trailing: _StatusChip(status: b.status),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String? status;

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'pending' => Colors.orange,
      'confirmed' => Colors.blue,
      'done' => Colors.green,
      'cancelled' => Colors.red,
      _ => Colors.grey,
    };
    return Chip(
      label: Text(status ?? '-'),
      labelStyle: TextStyle(color: color, fontSize: 11),
      visualDensity: VisualDensity.compact,
      side: BorderSide(color: color),
    );
  }
}