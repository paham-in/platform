import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final subjectsProvider = FutureProvider.family<List<SubjectListSubjectsResponse>, int>((ref, classId) async =>
    (await ref.read(apiProvider).getSubjectsApi().subjectsGet(classId: classId)).data!);

class SubjectsScreen extends ConsumerWidget {
  const SubjectsScreen({super.key, required this.classId});

  final int classId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjects = ref.watch(subjectsProvider(classId));
    return Scaffold(
      appBar: AppBar(title: const Text('Mata Pelajaran')),
      body: AsyncView(
        value: subjects,
        onRetry: () => ref.invalidate(subjectsProvider(classId)),
        builder: (items) {
          if (items.isEmpty) {
            return const EmptyState(icon: Icons.menu_book_outlined, message: 'Belum ada mata pelajaran.');
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final s = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.menu_book)),
                  title: Text(s.name ?? '-'),
                  subtitle: s.materialCount == null ? null : Text('${s.materialCount} materi'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/kelas/$classId/${s.id}/bab'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}