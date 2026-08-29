import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final classesProvider = FutureProvider<List<ClassClassResponse>>((ref) async =>
    (await ref.read(apiProvider).getClassesApi().classesGet()).data!);

class BelajarScreen extends ConsumerWidget {
  const BelajarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final classes = ref.watch(classesProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Belajar')),
      body: AsyncView(
        value: classes,
        onRetry: () => ref.invalidate(classesProvider),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.school_outlined, message: 'Belum ada kelas.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final c = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.school)),
                  title: Text(c.name ?? 'Kelas'),
                  subtitle: c.slug == null ? null : Text(c.slug!),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/kelas/${c.id}/mapel'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}