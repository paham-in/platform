import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pahamin_api/pahamin_api.dart';

import '../../core/api.dart';
import '../../shared/widgets/async_view.dart';

final chaptersProvider = FutureProvider.family<List<ChapterChapterResponse>, (int, int)>((ref, args) async =>
    (await ref.read(apiProvider).getChaptersApi().chaptersGet(classId: args.$1, subjectId: args.$2)).data!);

class ChaptersScreen extends ConsumerWidget {
  const ChaptersScreen({super.key, required this.classId, required this.subjectId});

  final int classId;
  final int subjectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chapters = ref.watch(chaptersProvider((classId, subjectId)));
    return Scaffold(
      appBar: AppBar(title: const Text('Bab')),
      body: AsyncView(
        value: chapters,
        onRetry: () => ref.invalidate(chaptersProvider((classId, subjectId))),
        builder: (items) {
          if (items.isEmpty) return const EmptyState(icon: Icons.folder_open, message: 'Belum ada bab.');
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            itemBuilder: (context, i) {
              final ch = items[i];
              return Card(
                clipBehavior: Clip.antiAlias,
                child: ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.folder)),
                  title: Text(ch.title ?? '-'),
                  subtitle: ch.materialCount == null ? null : Text('${ch.materialCount} materi'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/kelas/$classId/$subjectId/${ch.id}/materi'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}